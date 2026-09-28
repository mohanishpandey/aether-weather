import app from './app.js';
app.listen(process.env.PORT || 3001, () => console.log('Weather API listening on port ' + (process.env.PORT || 3001)));
