var CmxUtil = function () {
    this.clearAllMessages = function () {
        $("#success-result").hide();
        $("#error-result").hide();
    };

    this.displayPopupMessage = function(message) {
        logger.silly("Displaying popup message: " + message);
        $("#modal-body-errors-message p").html(message);
        $("#modal-errors").modal("show");
    };

    this.showSuccessMessage = function(message) {
        logger.silly("Displaying success message: " + message);
        $('#success-message').html(message);
        $("#success-result").show();
    };

    this.showErrorMessage = function(message) {
        logger.silly("Displaying error message: " + message);
        $('#error-message').html(message);
        $("#error-result").show();
    };
};

var cmxUtil = new CmxUtil();
