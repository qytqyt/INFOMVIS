function pyramidBuilder(data, target, options, country) {
  d3.select(target).selectAll("*").remove();

  const barHeight = options.barHeight || 20;
  const padding = options.padding || 10;
  const numBars = data.length;
  const totalHeight = numBars * (barHeight + padding);

  const containerWidth = d3.select(target).node().clientWidth;
  const containerHeight = d3.select(target).node().clientHeight;

  const margin = {
    top: 20,
    right: 0,
    bottom: 60,
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
          d3.max(data, (d) => d.tele_points + 20),
          d3.max(data, (d) => d.jury_points + 20)
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
      .text("Tele Vote");

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
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", style.tooltipBG)
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("opacity", 0);

  // Tooltip interactions
  svg.selectAll("rect")
      .on("mouseover", function(event, d) {
        // Highlight bars
        svg.selectAll("rect")
            .filter((barData) => barData.to_country === d.to_country)
            .attr("fill", "yellow");

        tooltipDiv.transition().duration(200).style("opacity", 0.9);
        tooltipDiv.html(
            `<strong>${d.to_country}</strong><br/>
        Televote: ${d.tele_points.toFixed(1)}<br/>
        Jury: ${d.jury_points.toFixed(1)}<br/>
        Total: ${(d.tele_points + d.jury_points).toFixed(1)}`
        )
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
      })
      .on("mousemove", function(event) {
        tooltipDiv
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function(event, d) {
        svg.selectAll("rect")
            .filter((barData) => barData.to_country === d.to_country)
            .attr("fill", (barData) =>
                barData.to_country === country
                    ? 'black'
                    : (barData === d ? style.leftBarColor : style.rightBarColor)
            );

        tooltipDiv.transition().duration(500).style("opacity", 0);
      });

  // Add fullscreen toggle
  d3.select(target)
      .append("div")
      .attr("class", "expand-icon")
      .text("⤢")
      .style("position", "absolute")
      .style("top", "10px")
      .style("right", "10px")
      .style("cursor", "pointer")
      .on("click", () => toggleFullscreen(target, data, options, country));
}

// Load and process data for specific year
function loadYearData(year, target, options, country) {
  d3.csv('resources/votes.csv').then((data) => {
    // Filter for selected year
    const yearData = data.filter(d => +d.year === +year);

    // Aggregate votes by country
    // const aggregatedData = Array.from(d3.group(yearData, d => d.to_country))
    //     .map(([country, votes]) => ({
    //         to_country: country,
    //         tele_points: d3.sum(votes, v => +v.tele_points || 0),
    //         jury_points: d3.sum(votes, v => +v.jury_points || 0),
    //         total_points: d3.sum(votes, v => (+v.tele_points || 0) + (+v.jury_points || 0))
    //     }));

    const aggregatedData = Array.from(d3.group(yearData, d => d.to_country))
        .map(([country, votes]) => {
          const total = d3.sum(votes, v => Number(v.total_points) || 0);
          // year <= 2015, split half of total_points between jury_points and tele_points
          if (+year <= 2015) {
            const halfTotal = total / 2;
            return {
              to_country: country,
              tele_points: halfTotal,
              jury_points: halfTotal,
              total_points: total
            };
          }

          // Normal processing of year >= 2016
          const jury = d3.sum(votes, v => Number(v.jury_points) || 0);
          const tele = d3.sum(votes, v => Number(v.tele_points) || 0);

          return {
            to_country: country,
            tele_points: tele || 0,
            jury_points: jury || 0,
            total_points: total
          };
        });

    // Sort by total points
    aggregatedData.sort((a, b) => b.total_points - a.total_points);

    // Build pyramid with processed data
    pyramidBuilder(aggregatedData, target, options, country);
  }).catch(error => {
    console.error('Error loading or processing data:', error);
  });
}

// Initialize visualization
function initVisualization(target, options, country) {
  // Load available years
  d3.csv('resources/votes.csv').then((data) => {
    const years = [...new Set(data.map(d => d.year))].sort((a, b) => +a - +b);

    const yearSelect = document.querySelector('#year-select');
    if (!yearSelect) {
      console.error('Year selector not found in DOM');
      return;
    }

    // delete current year option
    yearSelect.innerHTML = '';

    // add year option
    years.forEach(year => {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    });

    // set default year(latest year) and load
    const initialYear = years[years.length - 1];
    yearSelect.value = initialYear;

    yearSelect.addEventListener('change', function() {
      loadYearData(this.value, target, options, country);
    });

    loadYearData(initialYear, target, options, country);
  }).catch(error => {
    console.error('Error loading years:', error);
  });
}

function toggleFullscreen(target, data, options, country) {
  const container = d3.select(target);
  const isFullscreen = container.classed("fullscreen");

  container.classed("fullscreen", !isFullscreen);

  if (!isFullscreen) {
    options.width = window.innerWidth * 0.9;
    options.height = window.innerHeight * 0.9;
  } else {
    options.width = 500;
    options.height = 400;
  }

  pyramidBuilder(data, target, options, country);
}

// Add CSS styles
const style = document.createElement('style');
style.textContent = `
  .fullscreen {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 9999 !important;
    background: white !important;
    padding: 20px !important;
    box-sizing: border-box !important;
  }
  
  .tooltip {
    position: absolute;
    background-color: rgba(255, 255, 255, 0.9);
    border: 1px solid #ddd;
    padding: 8px;
    border-radius: 4px;
    pointer-events: none;
    font-size: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .year-selector {
    margin: 20px 0;
    font-family: Arial, sans-serif;
  }
  
  .year-selector select {
    padding: 5px 10px;
    border-radius: 4px;
    border: 1px solid #ccc;
    font-size: 14px;
  }
  
  .expand-icon {
    font-size: 20px;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
  }
  
  .expand-icon:hover {
    opacity: 1;
  }
`;
document.head.appendChild(style);

// Initialize when document loads
document.addEventListener('DOMContentLoaded', () => {
  const target = '#piramid-container';
  const options = {
    width: 500,
    height: 400,
    barHeight: 7.5,
    padding: 5,
    style: {
      leftBarColor: '#006837',
      rightBarColor: '#006837',
      tooltipBG: '#F0F0F0',
      tooltipColor: '#202020'
    }
  };
  const country = "es";

  initVisualization(target, options, country);

  // Handle ESC key for exiting fullscreen
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const container = d3.select(target);
      if (container.classed('fullscreen')) {
        const data = container.property('__data__');
        toggleFullscreen(target, data, options, country);
      }
    }
  });
});