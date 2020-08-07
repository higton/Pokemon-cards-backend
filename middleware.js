const jwt = require('jsonwebtoken');

// Loads environment variables from .env
require('dotenv').config()
const secret = 'f9bf78b9a18ce6d46a0cd2b0b86df9da';

function withAuth (req, res, next) {

	let token = '';

	if(req.headers.authorization){
		token = req.headers.authorization.split(' ')[1];
	}
	console.log('token', token);
	if (token === '') {
		res.status(401).send('Unauthorized: No token provided');
	} else {
		jwt.verify(token, secret, function(err, decoded) {
			if (err) {
				res.status(401).send('Unauthorized: Invalid token');
			} else {
				console.log('decoded11111', decoded);
				res.username = decoded.username;
				next();
			}
		});
	}
}

module.exports = withAuth;