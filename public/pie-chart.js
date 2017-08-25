$(document).ready(function() {
  //No idea how to get the information from the database to this document
  //Maybe an ajax request but still really confused how that would work
  //Using options as a placeholder for the information
  var ctx = document.getElementById("chart").getContext('2d');
  var labels = Object.keys(JSON.parse($('#chartOptions').val()));
  var data = Object.values(JSON.parse($('#chartOptions').val()));
  var possibleColors = ["#2ecc71", "#3498db", "#95a5a6", "#9b59b6", "#f1c40f", "#e74c3c", "#34495e", "#ff6384", "#36a2eb", "#cc65fe", "#ffce56"]
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
