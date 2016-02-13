var Logger = function () {
    var logLevel = 2;
    var LogLevels = { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 };

    this.error = function(message) {
        if (logLevel >= LogLevels.error) {
            logMessage("ERROR", message);
        }
    };

    this.warn = function(message) {
        if (logLevel >= LogLevels.warn) {
            logMessage("WARN", message);
        }
    };

    this.info = function(message) {
        if (logLevel >= LogLevels.info) {
            logMessage("INFO", message);
        }
    };

    this.debug = function(message) {
        if (logLevel >= LogLevels.debug) {
            logMessage("DEBUG", message);
        }
    };

    this.silly = function(message) {
        if (logLevel >= LogLevels.silly) {
            logMessage("SILLY", message);
        }
    };

    logMessage = function(logLevelString, message) {
        console.log(new Date() + " - " + logLevelString + ": " + message);
    };
};

var logger = new Logger();
