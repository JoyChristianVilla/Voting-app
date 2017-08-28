$(document).ready(function() {
  //No idea how to get the information from the database to this document
  //Maybe an ajax request but still really confused how that would work
  //Using options as a placeholder for the information
  var ctx = document.getElementById("chart").getContext('2d');
  var labels = Object.keys(JSON.parse($('#chartOptions').val()));
  var data = Object.values(JSON.parse($('#chartOptions').val()));
  var possibleColors = ["#1abc9c", "#8e44ad", "#f1c40f", "#2980b9", "#c0392b", "#2ecc71", "#e67e22", "#3498db", "#e74c3c", "#9b59b6", "#d35400", "#ecf0f1", "#27ae60", "#bdc3c7", "#16a085", "#34495e", "#f39c12", "#7f8c8d"];
  var colors = [];
  for (i = 0; i < data.length; i++) {
    colors.push(possibleColors[i]);
  }
  var chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        backgroundColor: colors,
        data: data
      }]
    }
  });
})
