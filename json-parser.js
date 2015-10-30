var getRawBody = require('raw-body')

module.exports = function () {
    return function (req, res, next) {

        getRawBody(req, {
            length: req.headers['content-length'],
            limit: '1mb',
            encoding: 'utf8'
        }, function (err, string) {
            if (err) return next(err)
                req.body = JSON.parse(string)
            next()
        })
    };
};
