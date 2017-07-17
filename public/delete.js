$(document).ready(function() {
  $('#delete').click(function() {
    $.ajax({
      method: 'DELETE',
      url: '/delete/:id'
      //Really stumped on how to do this
    })
  })
})
