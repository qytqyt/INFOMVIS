function pyramidBuilder(data, target, options, country) {

  d3.select(target).selectAll("*").remove();

  const barHeight = options.barHeight || 20;
  const padding = options.padding || 10;
  const numBars = data.length;
  const totalHeight = numBars * (barHeight + padding);

  const containerWidth = d3.select(target).node().clientWidth;
  const containerHeight = d3.select(target).node().clientHeight;

  //  config
  const margin = {
    top: 20,
    right: 0,
    bottom: 60, // Espacio extra para ejes
    left: 0,
    middle: 20,
  };


  const sectorWidth = containerWidth / 2 - margin.middle;
  const leftBegin = sectorWidth - margin.left;
  const rightBegin = containerWidth - margin.right - sectorWidth;


  const style = {
    leftBarColor: options.style?.leftBarColor || '#006837',
    rightBarColor: options.style?.rightBarColor || '#006837',
    tooltipBG: options.style?.tooltipBG || '#F0F0F0',
    tooltipColor: options.style?.tooltipColor || '#202020',
  };

  // Max value for x-scales
  const maxValue = Math.ceil(
      Math.max(
          d3.max(data, (d) => d.tele_points+20),
          d3.max(data, (d) => d.jury_points+20)
      )
  );

  // Scales
  const xScaleLeft = d3.scaleLinear().domain([0, maxValue]).range([sectorWidth, 0]);
  const xScaleRight = d3.scaleLinear().domain([0, maxValue]).range([0, sectorWidth]);
  const yScale = d3
      .scaleBand()
      .domain(data.map((d) => d.to_country))
      .range([0, totalHeight])
      .padding(0.1);

  // Container
  const container = d3.select(target)
      // The container is already sized in CSS.
      .style("overflow-y", "auto");

  // Create SVG
  const svg = container
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', totalHeight + margin.top + margin.bottom);

  const chartGroup = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

  // Left bars (Televote)
  const leftBarGroup = chartGroup
      .append('g')
      .attr('transform', `translate(${leftBegin},0) scale(-1,1)`);

  leftBarGroup
      .selectAll('.bar.left')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar left')
      .attr('x', 0)
      .attr('y', (d) => yScale(d.to_country))
      .attr('width', (d) => xScaleLeft(0) - xScaleLeft(d.tele_points))
      .attr('height', yScale.bandwidth())
      .attr('fill', (d) => d.to_country === country ? 'black' : style.leftBarColor);

  // Right bars (Jury)
  const rightBarGroup = chartGroup
      .append('g')
      .attr('transform', `translate(${rightBegin},0)`);

  rightBarGroup
      .selectAll('.bar.right')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar right')
      .attr('x', 0)
      .attr('y', (d) => yScale(d.to_country))
      .attr('width', (d) => xScaleRight(d.jury_points))
      .attr('height', yScale.bandwidth())
      .attr('fill', (d) => d.to_country === country ? 'black' : style.rightBarColor);

  // Middle labels
  chartGroup
      .selectAll('.label.middle')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'label middle')
      .attr('x', containerWidth / 2)
      .attr('y', (d) => yScale(d.to_country) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .text((d) => d.to_country);

  // Axes
  const yAxisLeft = d3.axisRight(yScale).tickSize(0).tickFormat('');
  const yAxisRight = d3.axisLeft(yScale).tickSize(0).tickFormat('');
  const xAxisLeft = d3.axisBottom(xScaleLeft).ticks(5);
  const xAxisRight = d3.axisBottom(xScaleRight).ticks(5);

  chartGroup
      .append('g')
      .attr('class', 'axis y left')
      .attr('transform', `translate(${leftBegin},0)`)
      .call(yAxisLeft);

  chartGroup
      .append('g')
      .attr('class', 'axis y right')
      .attr('transform', `translate(${rightBegin},0)`)
      .call(yAxisRight);

  chartGroup
      .append('g')
      .attr('class', 'axis x left')
      .attr('transform', `translate(0,${totalHeight})`)
      .call(xAxisLeft);

  chartGroup
      .append('g')
      .attr('class', 'axis x right')
      .attr('transform', `translate(${rightBegin},${totalHeight})`)
      .call(xAxisRight);

  // Axis Labels
  chartGroup
      .append("text")
      .attr("class", "label axis-left")
      .attr("x", leftBegin / 2)
      .attr("y", totalHeight + 35)
      .attr("text-anchor", "middle")
      .text("Televote");

  chartGroup
      .append("text")
      .attr("class", "label axis-right")
      .attr("x", rightBegin + sectorWidth / 2)
      .attr("y", totalHeight + 35)
      .attr("text-anchor", "middle")
      .text("Jury Vote");

  // Tooltip
  const tooltipDiv = d3.select(target)
      .append("div")
      .attr("class", "tooltip");

  svg.selectAll("rect")
      .on("mouseover", function (event, d) {
        // Highlight bars with same country
        svg.selectAll("rect")
            .filter((barData) => barData.to_country === d.to_country)
            .attr("fill", "yellow");

        tooltipDiv.transition().duration(200).style("opacity", 0.9);
        tooltipDiv.html(
            `<strong>${d.to_country}</strong><br/>
           Tele Points: ${d.tele_points}<br/>
           Jury Points: ${d.jury_points}`
        );
      })
      .on("mousemove", function (event) {
        const [x, y] = d3.pointer(event, svg.node());
        tooltipDiv
            .style("left", (x + 20) + "px")
            .style("top", (y + 20) + "px");
      })
      .on("mouseout", function (event, d) {
        svg.selectAll("rect")
            .filter((barData) => barData.to_country === d.to_country)
            .attr("fill", (barData) =>
                barData.to_country === country
                    ? 'black'
                    : (barData.tele_points === d.tele_points
                        ? style.leftBarColor
                        : style.rightBarColor)
            );

        tooltipDiv.transition().duration(500).style("opacity", 0);
      });
}


function toggleFullscreen(target, data, options, country) {
  const container = d3.select(target);
  const isFullscreen = container.classed("fullscreen");
  container.classed("fullscreen", !isFullscreen);

  
  pyramidBuilder(data, target, options, country);

  d3.select(target)
      .append("div")
      .attr("class", "expand-icon")
      .text("⤢")
      .on("click", () => toggleFullscreen(target, data, options, country));
}


d3.csv('resources/sampledatapiramid.csv').then((data) => {
  data.forEach((d) => {
    d.tele_points = +d.tele_points;
    d.jury_points = +d.jury_points;
  });
  data.sort((a, b) => a.total_points - b.total_points);

  const target = '#piramid-container';
  const options = { width: 500, height: 400, barHeight: 7.5, padding: 5 };
  const country = "es";


  pyramidBuilder(data, target, options, country);


  d3.select(target)
      .append("div")
      .attr("class", "expand-icon")
      .text("⤢")
      .on("click", () => toggleFullscreen(target, data, options, country));

  
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const container = d3.select(target);
      if (container.classed('fullscreen')) {
        toggleFullscreen(target, data, options, country);
      }
    }
  });
});

