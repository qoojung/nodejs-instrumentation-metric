const express = require('express');
const { installMetricHandler, metricMiddleware } = require('./metric')();

const app = express();
const port = 3000;
app.use(metricMiddleware);

app.get('/', (req, res) => {
  res.send('Hello World!');
});
installMetricHandler(app);
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
