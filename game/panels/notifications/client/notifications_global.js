Template.notifications_global.helpers({
	notifications: function() {
		var self = this
		var not = Notifications.find({}, {sort: {created_at: -1}})
		// battle notifications are doubled because one is created for both attacker and defender
		// only show people who win
		not = _.filter(not.fetch(), function(n) {
			if (n.type == 'battle') {
				var unit = n.vars.battle.unit
				// return true if won battle
				// also return true if tied, this gets doubled up
				if (unit) {
					if (unit.dif >= 0) {
						return true
					} else {
						return false
					}
				} else {
					return false
				}

			} else {
				return true
			}
		})
		return not
	},

	notification_type: function() {
		return 'not_'+this.type
	},

	show_notification: function() {
		if (Session.get('current_notification_id') == this._id) {
			return true
		}
		return false
	},
})

Template.notifications_global.events({
	'click .read_notification_button': function(event, template) {
		if (Session.get('current_notification_id') == this._id) {
			Session.set('current_notification_id', undefined)
		} else {
			Session.set('current_notification_id', this._id)
		}
	},
})

Template.notifications_global.rendered = function() {
	var self = this
	Session.set('current_notification_id', undefined)
	self.deps_subscribe_global = Deps.autorun(function() {
		Meteor.subscribe('global_notifications')
	})
}

Template.notifications_global.destroyed = function() {
	var self = this
	if (self.deps_subscribe_global) {
		self.deps_subscribe_global.stop()
	}
}