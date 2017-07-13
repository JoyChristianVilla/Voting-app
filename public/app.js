$(document).ready(function() {
  var option = 3;
  $('.btn-ghost').click(function() {
    $('#inputs').append('<input type="text" name="option' + option.toString() + '"><br>');
    option++;
  });
});
