const notifier = require('node-notifier');

class Notifier {
  constructor() {
    this.notify = this.notify.bind(this);
    this.latestNotificationTime = new Date().getTime();
  }

  notify(options) {
    if (new Date(options.createdAt).getTime() > this.latestNotificationTime) {
      notifier.notify(options);
      this.latestNotificationTime = new Date().getTime();
      return true;
    } else {
      return false;
    }
  }
}

module.exports = Notifier;
