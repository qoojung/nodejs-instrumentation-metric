const client = require('prom-client');
const responseTime = require('response-time');

const {
  Registry, Histogram, Counter, Summary,
} = client;

module.exports = ({ metricPath = '/metrics' } = {}) => {
  const register = new Registry();
  const responseTimeSummary = new Summary({
    name: 'api_request_duration_ms_summmry',
    help: 'response time metric summmry',
    labelNames: ['method', 'path'],
    registers: [register],
  });
  const responseTimeHisto = new Histogram({
    name: 'api_request_duration_sec_histo',
    help: 'response time metric histo',
    labelNames: ['method', 'path'],
    registers: [register],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.75, 0.5, 1, 2.5, 5, 7.5, 10], // 10 sec
  });
  const requestCounter = new Counter({
    name: 'api_request_count',
    help: 'request counter',
    labelNames: ['method', 'path', 'code'],
    registers: [register],
  });
  client.collectDefaultMetrics({ register });
  const metricMiddleware = responseTime((req, res, time) => {
    try {
      if (req.route && req.route.path === metricPath) {
        return;
      }
      if (!req.route) return;
      const pathPattern = `${req.baseUrl}${req.route.path}`;
      // observe values.
      responseTimeHisto.labels(req.method, pathPattern).observe(time);
      responseTimeSummary.labels(req.method, pathPattern).observe(time);
      requestCounter.labels(req.method, pathPattern, res.statusCode).inc(1);
    } catch (error) {
      console.error(error);
    }
  });
  const metricHandler = async (_, res) => {
    try {
      res.set('Content-Type', register.contentType);
      res.send(await register.metrics());
    } catch (error) {
      res.sendStatus(500);
    }
  };
  const installMetricHandler = (app) => {
    app.get(metricPath, metricHandler);
  };

  return { installMetricHandler, metricHandler, metricMiddleware };
};
