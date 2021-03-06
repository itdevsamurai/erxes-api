import graph from 'fbgraph';
import { getConfig, receiveWebhookResponse } from './facebook';

/*
 * Common graph api request wrapper
 * catchs auth token or other type of exceptions
 */
export const graphRequest = {
  base(method, path, accessToken, ...otherParams) {
    // set access token
    graph.setAccessToken(accessToken);

    return new Promise((resolve, reject) => {
      graph[method](path, ...otherParams, (error, response) => {
        if (error) {
          return reject(error);
        }

        return resolve(response);
      });
    });
  },

  get(...args) {
    return this.base('get', ...args);
  },

  post(...args) {
    return this.base('post', ...args);
  },
};

/*
 * Listen for facebook webhook response
 */
export const trackIntegrations = expressApp => {
  for (let app of getConfig()) {
    expressApp.get(`/service/facebook/${app.id}/webhook-callback`, (req, res) => {
      const query = req.query;

      // when the endpoint is registered as a webhook, it must echo back
      // the 'hub.challenge' value it receives in the query arguments
      if (query['hub.mode'] === 'subscribe' && query['hub.challenge']) {
        if (query['hub.verify_token'] !== app.verifyToken) {
          res.end('Verification token mismatch');
        }

        res.end(query['hub.challenge']);
      }
    });

    expressApp.post(`/service/facebook/${app.id}/webhook-callback`, (req, res) => {
      res.statusCode = 200;

      // receive per app webhook response
      receiveWebhookResponse(app, req.body);

      res.end('success');
    });
  }
};
