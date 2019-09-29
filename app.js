require('dotenv').config();
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const graphqlHttp = require('express-graphql');

const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
const auth = require('./middleware/auth');

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, `${new Date().toISOString()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png'
    || file.mimetype === 'image/jpg'
    || file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// app.use(bodyParser.urlencoded()); // x-www-urlencoded
app.use(bodyParser.json()); // application/json
app.use(multer({ storage: fileStorage, fileFilter }).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(cors());

app.use(auth);

app.use('/graphql', graphqlHttp({
  schema: graphqlSchema,
  rootValue: graphqlResolver,
  graphiql: true,
  customFormatErrorFn(error) {
    if (!error.originalError) {
      return error;
    }
    const { data, code = 500 } = error.originalError;
    const { message = 'An error occured' } = error;
    return {
      message,
      status: code,
      data,
    };
  },
}));

// app.use((error, req, res) => {
//   const { statusCode = 500, message, data } = error;
//   res.status(statusCode).json({ message, data });
// });

mongoose
  .connect(process.env.MONGODB_URI, {
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(8080, () => console.log('http://localhost:8080/graphql'));
  })
  .catch(error => console.log(error));
