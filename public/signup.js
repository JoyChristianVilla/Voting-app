$(document).ready(function() {
  $('#password').keydown(function() {
    if ($('#password').val().length < 6) {
      $('#warning').html('Password must be at least 6 characters');
    } else {
      $('#warning').html('Valid password!')
    }
  })
})
