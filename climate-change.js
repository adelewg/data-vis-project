function ClimateChange() {

  // Name for the visualisation to appear in the menu bar.
  this.name = 'Climate Change';

  // Each visualisation must have a unique ID with no special
  // characters.
  this.id = 'climate-change';

  // Names for each axis.
  this.xAxisLabel = 'year';
  this.yAxisLabel = '℃';

  // Number of axis tick labels to draw so that they are not drawn on
  // top of one another.
  this.numXTickLabels = 8;
  this.numYTickLabels = 8;

  // Locations of margin positions. Left and bottom have double pad
  // due to axis and tick labels.
  this.marginSize = 35;
  this.leftMargin = this.marginSize * 2;
  this.rightMargin = width - this.marginSize;
  this.plotWidth = this.rightMargin - this.leftMargin;
  this.topMargin = this.marginSize;
  this.bottomMargin = height - this.marginSize * 2;

  // Property to represent whether data has been loaded.
  this.loaded = false;

  // Preload the data. This function is called automatically by the
  // gallery when a visualisation is added.
  this.preload = function() {
    var self = this;
    this.data = loadTable(
      './data/surface-temperature/surface-temperature.csv', 'csv', 'header',
      // Callback function to set the value
      // this.loaded to true.
      function(table) {
        self.loaded = true;
      });
  };

  this.setup = function() {
    // Font defaults.
    textSize(16);
    textAlign('center', 'center');

    // Set min and max years: assumes data is sorted by date.
    this.minYear = this.data.getNum(0, 'date');
    this.maxYear = this.data.getNum(this.data.getRowCount() - 1, 'date');

    // Find min and max temperature for mapping to canvas height.
    this.minTemperature = min(this.data.getColumn('temperature'));
    this.maxTemperature = max(this.data.getColumn('temperature'));

    // Find mean temperature to plot average marker.
    this.meanTemperature = mean(this.data.getColumn('temperature'));

    // Count the number of frames drawn since the visualisation
    // started so that we can animate the plot.
    this.frameCount = 0;

    // Create sliders to control start and end years. Default to
    // visualise full range.
    this.startSlider = createSlider(this.minYear,
                                    this.maxYear - 1,
                                    this.minYear,
                                    1);
    this.startSlider.position(400, 10);

    this.endSlider = createSlider(this.minYear + 1,
                                  this.maxYear,
                                  this.maxYear,
                                  1);
    this.endSlider.position(600, 10);
  };

  this.destroy = function() {
    this.startSlider.remove();
    this.endSlider.remove();
  };

  this.draw = function() {
    if (!this.loaded) {
      console.log('Data not yet loaded');
      return;
    }

    // Prevent slider ranges overlapping.
    if (this.startSlider.value() >= this.endSlider.value()) {
      this.startSlider.value(this.endSlider.value() - 1);
    }
    this.startYear = this.startSlider.value();
    this.endYear = this.endSlider.value();

    // Draw both x and y axis labels.
    this.drawAxisLabels();

    // Draw all y-axis tick labels.
    this.drawYAxisTickLabels();

    // Plot average line.
    stroke(200);
    strokeWeight(1);
    line(this.leftMargin,
         this.mapTemperatureToHeight(this.meanTemperature),
         this.rightMargin,
         this.mapTemperatureToHeight(this.meanTemperature));

    // Plot all temperatures between startYear and endYear using the
    // width of the canvas minus margins.
    var previousYear;
    var numYears = this.endYear - this.startYear;
    var segmentWidth = (this.rightMargin - this.leftMargin) / numYears;

    // Count the number of years plotted each frame to create
    // animation effect.
    var yearCount = 0;

    // Loop over all rows but only plot those in range.
    for (var i = 0; i < this.data.getRowCount(); i++) {

      // Create an object to store data for the current year.
      var currentYear = {
        // Convert strings to numbers.
        'date': this.data.getNum(i, 'date'),
        'temperature': this.data.getNum(i, 'temperature')
      };

      if (previousYear != null
          && currentYear.date > this.startYear
          && currentYear.date <= this.endYear) {

        // Draw background gradient to represent colour temperature of
        // the current year.
        noStroke();
        fill(this.mapTemperatureToColour(currentYear.temperature));
        rect(this.mapYearToWidth(previousYear.date),
             this.topMargin,
             segmentWidth,
             this.bottomMargin - this.topMargin);

        // Draw line segment connecting previous year to current
        // year temperature.
        stroke(0);
        line(this.mapYearToWidth(previousYear.date),
             this.mapTemperatureToHeight(previousYear.temperature),
             this.mapYearToWidth(currentYear.date),
             this.mapTemperatureToHeight(currentYear.temperature));

        // The number of x-axis labels to skip so that only
        // numXTickLabels are drawn.
        var xLabelSkip = ceil(numYears / this.numXTickLabels);

        // Draw the tick label marking the start of the previous year.
        if (yearCount % xLabelSkip == 0) {
          this.drawXAxisTickLabel(previousYear.date);
        }

        // When six or fewer years are displayed also draw the final
        // year x tick label.
        if ((numYears <= 6
             && yearCount == numYears - 1)) {
          this.drawXAxisTickLabel(currentYear.date);
        }

        yearCount++;
      }

      // Stop drawing this frame when the number of years drawn is
      // equal to the frame count. This creates the animated effect
      // over successive frames.
      if (yearCount >= this.frameCount) {
        break;
      }

      // Assign current year to previous year so that it is available
      // during the next iteration of this loop to give us the start
      // position of the next line segment.
      previousYear = currentYear;
    }

    // Count the number of frames since this visualisation
    // started. This is used in creating the animation effect and to
    // stop the main p5 draw loop when all years have been drawn.
    this.frameCount++;

    // Stop animation when all years have been drawn.
    if (this.frameCount >= numYears) {
      //noLoop();
    }
  };

  this.drawAxisLabels = function() {
    fill(0);
    noStroke();

    // Draw x-axis label.
    text(this.xAxisLabel,
         (this.plotWidth / 2) + this.leftMargin,
         this.bottomMargin + (this.marginSize * 1.5));

    // Draw y-axis label.
    push();
    translate(this.leftMargin - (this.marginSize * 1.5), this.bottomMargin / 2);
    rotate(- PI / 2);
    text(this.yAxisLabel, 0, 0);
    pop();

  };

  this.drawYAxisTickLabels = function() {
    fill(0);
    noStroke();

    var temperatureRange = this.maxTemperature - this.minTemperature;
    var yLabelStep = temperatureRange / this.numYTickLabels;

    // Draw all axis tick labels.
    for (i = 0; i <= this.numYTickLabels; i++) {
      var temperature = this.minTemperature + (i * yLabelStep);
      text(temperature.toFixed(1),
           this.leftMargin - this.marginSize / 2,
           this.mapTemperatureToHeight(temperature));
    }
  };

  this.drawXAxisTickLabel = function(date) {
    fill(0);
    noStroke();
    text(date,
         this.mapYearToWidth(date),
         this.bottomMargin + this.marginSize / 2);
  };

  this.mapYearToWidth = function(value) {
    return map(value,
               this.startYear,
               this.endYear,
               this.leftMargin,   // Draw left-to-right from margin.
               this.rightMargin);
  };

  this.mapTemperatureToHeight = function(value) {
    return map(value,
               this.minTemperature,
               this.maxTemperature,
               this.bottomMargin, // Lower temperature at bottom.
               this.topMargin);   // Higher temperature at top.
  };

  this.mapTemperatureToColour = function(value) {
    var red =  map(value,
                   this.minTemperature,
                   this.maxTemperature,
                   0,
                   255);
    var blue = 255 - red;
    return color(red, 0, blue, 100);
  };
}
