const octokit = require('@octokit/rest')();
const color = require('chalk');
const Notifier = require('./notifier');

class Crawler {
  /**
   * @param {Object} options
   *                 .username:string, define which user's feed to crawl
   *                 .selfCentered:bool, true => only notify for *username* repos
   *                 .interval:number, interval between each crawl in ms
   *                 .silent:bool, to log or not to log
   *                 .perPage:number, how many results per page for each crawl request
   */
  constructor(options) {
    this.timeout = null;
    this.options = Object.assign({
      selfCentered: false,
      interval: 5000 * 60, // every 5 minutes
      silent: false,
      perPage: 30,
    }, options);
    this.notifier = new Notifier();

    this.log = this.log.bind(this);
    this.run = this.run.bind(this);
    this.stop = this.stop.bind(this);
    this.crawl = this.crawl.bind(this);
  }

  log(...args) {
    if (!this.options.silent) {
      console.log(color.gray(new Date().toLocaleString()), ...args);
    }
  }

  run() {
    const options = Object.entries(this.options)
      .map(([key, value]) => color.bold(`${key}=${value}`))
      .join(', ');

    this.log(color.yellow('With options:'), options);
    this.log(color.green('Started'));
    this.crawl();
  }

  stop() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  async crawl() {
    try {
      this.log(color.blue('Crawling'));

      let { data: feed } = await octokit.activity.getEventsReceivedPublic({
        username: this.options.username,
        per_page: this.options.perPage,
      });

      if (feed) {
        feed = feed.reverse();

        for (const activityElement of feed) {
          switch (activityElement.type) {
            case 'WatchEvent':
              const [owner, repoName] = activityElement.repo.name.split('/');
              const icon = activityElement.actor.avatar_url || null;
              const watcher = activityElement.actor.display_login;
              let isMine = false;

              if (owner === this.options.username) isMine = true;
              if (this.options.selfCentered && !isMine) continue;

              const notificationOptions = {
                icon,
                title: watcher,
                message: `Starred ${isMine ? 'your' : 'a'} repo ${repoName}`,
                createdAt: activityElement.created_at,
              };

              if (this.notifier.notify(notificationOptions)) {
                this.log(color.green('Notified for watch-event'), watcher, `${owner}/${repoName}`);
              }
              break;

            case 'ForkEvent':
              // TODO
              break;

            default:
              continue;
          }
        }
      }

      this.log(color.yellow('Next crawl in'), `${this.options.interval}ms`);
      this.timeout = setTimeout(this.crawl, this.options.interval);
    } catch (error) {
      this.log(color.red('Failed crawling'), error.message);
    }
  }
}

module.exports = Crawler;
