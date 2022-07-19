const express = require('express');
const { installMetricHandler, metricMiddleware } = require('./metric')();

const app = express();
const port = process.env.port || 9898;
app.use(metricMiddleware);

app.get('/', (req, res) => {
  res.send('Hello World!');
});
installMetricHandler(app);
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
