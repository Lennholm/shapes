/**
 * The provided callback will be called with the result as an object
 * on the form {distance: value}
 */
var getDistanceAPI = function (callback) {
    var distance = {distance: Math.floor((Math.random()*4)+1)},
        delay = Math.floor((Math.random()*1800)+200);
        if (typeof callback !== 'undefined') {
            setTimeout(function () {
                callback(distance);
            }, delay);
        }
};