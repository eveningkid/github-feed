#!/usr/bin/env node
const args = require('args-parser')(process.argv);
const Crawler = require('./crawler');

if (!args.username) {
  throw new Error('No user given. Set the github account name using --username');
}

let silent = false;
if (args.silent || args.s) {
  silent = true;
}

const username = args.username;
const selfCentered = args['self-centered'] || false;
const perPage = args['per-page'] || 30;
const interval = args.interval || 60 * 5000;

new Crawler({ username, silent, selfCentered, perPage }).run();
