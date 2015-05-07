$(document).ready(function() {
  $('#login').submit(function() {
    $.ajax({
        type: 'POST',
        url: window.location, 
        data: $('#login').serialize(),
        success: function(data) {
          if (data.success) {
            window.location = data.redirect;
          } else {
            $('#password').val
            if (!$('#totp').hasClass('hidden')) {
              $('#form-alert').text("Incorrect two factor authentication code!");
              $('#form-alert').removeClass('hidden'); 
            } else if (data.twoFactor) {
              $('#form-alert').addClass('hidden'); 
              $('#username').addClass('hidden');
              $('#password').addClass('hidden');
              $('#totp').removeClass('hidden');
            } else {
              $('#form-alert').text("Invalid username or password!");
              $('#form-alert').removeClass('hidden');
              $('#username').removeClass('hidden');
              $('#password').removeClass('hidden');
              $('#totp').addClass('hidden');
            }
          }
        }
      });
    return false;
  });
});