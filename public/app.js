$(document).ready(function() {
  var option = 3;
  $('.add-option').click(function() {
    $('#inputs').append('<input type="text" name="option' + option.toString() + '" id="option' + option.toString() + '"><br>');
    $('#option' + option.toString()).focus();
    option++;
  });
});
