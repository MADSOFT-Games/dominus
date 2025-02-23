// update relationships for user and everyone in his king's branch


relation_finder = function(user_id) {
	check(user_id, String)

	this.user_id = user_id
	this.user = Meteor.users.findOne(user_id, {fields: {lord:1}})
	if (!this.user) {
		throw new Meteor.Error(404, "Can't find user")
	}
	this.num_branches = 1
	this.team = []
	this.update_cache = []



	this.start = function() {
		var self = this
		self.find_top(self.user)
	}

	this.find_top = function(user) {
		check(user, Object)

		var self = this
		var lord = Meteor.users.findOne(user.lord, {fields: {lord:1}})
		if (lord) {
			if (user._id == lord._id) {
				throw new Meteor.Error(404, "infinite loop");
			}
			self.find_top(lord)
		} else {
			self.traverse_down(user)
		}
	}

	// find all the branch ends
	// add to team
	// keep track of num_branches so that we know when we're totally done
	this.traverse_down = function(user) {
		check(user, Object)
		var self = this

		// if this is not me add to team
		self.team.push(user._id)

		var vassals = Meteor.users.find({lord:user._id}, {fields: {lord:1}})
		if (vassals.count() == 0) {
			// reached end
			self.num_branches--
			self.traverse_up(user, [])
		} else {
			// record siblings
			var siblings = vassals.map(function(sib) {
				return sib._id
			})

			vassals.forEach(function(v) {
				// add siblings info to update_cache
				var cache_v = _.find(self.update_cache, function(cache) {
					return (cache.user_id == v._id)
				})

				// check if user is already in update_cache
				if (cache_v) {
					// if so add siblings
					cache_v.siblings = _.without(siblings, v._id)

					self.update_cache = _.reject(self.update_cache, function(cache) {
						return cache.user_id == cache_v.user_id
					})

					self.update_cache.push(cache_v)

				} else {
					// if not add new user
					self.update_cache.push({
						user_id: v._id,
						allies_below: [],
						allies_above: [],
						siblings: _.without(siblings, v._id)
					})
				}
			})

			self.num_branches += vassals.count() - 1
			vassals.forEach(function(vassal) {
				self.traverse_down(vassal)
			})
		}
	}


	// traverse through everyone on team up to the king
	this.traverse_up = function(user, allies_below_array) {
		check(user, Object)
		check(allies_below_array, Array)
		var self = this

		// loop through allies_below_array and add self to everyone's allies_above
		_.each(allies_below_array, function(id) {
			if (id != user._id) {
				// search for user in update_cache (everyone we've already run traverse_up on)
				var user_below = _.find(self.update_cache, function(cache) {
					return id == cache.user_id
				})

				if (user_below) {
					user_below.allies_above = _.union(user_below.allies_above, [user._id])
					
					// remove user below
					self.update_cache = _.reject(self.update_cache, function(cache) {
						return cache.user_id == user_below.user_id
					})

					// add him again with new allies_above
					self.update_cache.push(user_below)
				}
			}
		})

		// see if user is already in update_cache (another branch could have added him)
		var u = _.find(self.update_cache, function(cache) {
			return user._id == cache.user_id
		})

		if (u) {
			// if he is in then merge allies_below
			u.allies_below = _.union(u.allies_below, _.compact(allies_below_array))

			// remove self
			self.update_cache = _.reject(self.update_cache, function(cache) {
				return cache.user_id == user._id
			})

			// add with new values
			self.update_cache.push(u)

		} else {
			// if he's not then add him
			self.update_cache.push({
				user_id: user._id,
				allies_below: _.compact(allies_below_array),
				allies_above: [],
				siblings: []
			})
		}

		// traverse up
		var lord = Meteor.users.findOne(user.lord, {fields:{lord:1}})
		if (lord) {
			// add self
			allies_below_array.push(user._id)

			// process lord
			self.traverse_up(lord, allies_below_array)
		} else {
			self.reached_top(user)
		}
	}

	// at king
	this.reached_top = function(user) {
		var self = this
		check(self.team, Array)

		if (self.num_branches == 0) {
			// set king in team
			// record team in everyone

			self.update_cache = _.map(self.update_cache, function(cache) {
				cache.allies_below = _.without(cache.allies_below, cache.user_id)
				cache.allies_above = _.without(cache.allies_above, cache.user_id)
				cache.allies = _.union(cache.allies_below, cache.allies_above)
				return cache
			})

			_.each(self.update_cache, function(cache) {
				check(cache.allies, Array)
				check(cache.allies_below, Array)
				check(cache.allies_above, Array)
				check(cache.siblings, Array)

				Meteor.users.update(cache.user_id, {$set: {
					allies: cache.allies,
					allies_below: cache.allies_below,
					allies_above: cache.allies_above,
					king: user._id,
					siblings: cache.siblings,
					team: _.without(self.team, cache.user_id)
				}})

				update_vassal_ally_count(cache.user_id)
			})

			worker.enqueue('check_for_dominus', {})
			worker.enqueue('setup_king_chatroom', {king_id: user._id})
		}
	}

}