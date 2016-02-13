function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}

// debug flag, this is global
define('DEBUG', true);
define('TWILIO_PHONE', '1-999-999-9999');
define('TWILIO_ACCOUNT_SID', 'AAAAAAAAAAAAAAAAA');
define('TWILIO_ACCOUNT_TOKEN', 'BBBBBBBBBBBBBBBBB');
