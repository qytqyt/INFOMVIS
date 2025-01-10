function pyramidBuilder(data, target, options) {
	var w = options.width || 100,
		h = options.height || 100,
		w_full = w,
		h_full = h;

	var margin = {
			top: 20,
			right: 0,
			bottom: 20,
			left: 0,
			middle: 40
		},
		sectorWidth = (w / 2) - margin.middle,
		leftBegin = sectorWidth - margin.left,
		rightBegin = w - margin.right - sectorWidth;

	w = w - (margin.left + margin.right);
	h = h - (margin.top + margin.bottom);

	var style = {
		leftBarColor: options.style?.leftBarColor || '#B0B0B0', // Gris claro
		rightBarColor: options.style?.rightBarColor || '#505050', // Gris oscuro
		tooltipBG: options.style?.tooltipBG || '#F0F0F0', // Gris muy claro para el fondo del tooltip
		tooltipColor: options.style?.tooltipColor || '#202020' // Gris oscuro para el texto del tooltip
	};
	var maxValue = Math.ceil(Math.max(
		d3.max(data, d => d.tele_points),
		d3.max(data, d => d.jury_points)
	));

	// Define scales
	var xScaleLeft = d3.scaleLinear()
		.domain([0, maxValue+20])
		.range([sectorWidth, 0]);

	var xScaleRight = d3.scaleLinear()
		.domain([0, maxValue+20])
		.range([0, sectorWidth]);

	var yScale = d3.scaleBand()
		.domain(data.map(d => d.to_country))
		.range([0, h])
		.padding(0.1);

	// Create SVG
	var svg = d3.select(target)
		.append("svg")
		.attr("width", w_full)
		.attr("height", h_full);

	var chartGroup = svg.append("g")
		.attr("transform", `translate(${margin.left},${margin.top})`);

	// Left bars for tele points
	var leftBarGroup = chartGroup.append("g")
		.attr("transform", `translate(${leftBegin},0) scale(-1,1)`);

	leftBarGroup.selectAll(".bar.left")
		.data(data)
		.enter()
		.append("rect")
		.attr("class", "bar left")
		.attr("x", 0)
		.attr("y", d => yScale(d.to_country))
		.attr("width", d => xScaleLeft(0) - xScaleLeft(d.tele_points)) // Fixed width calculation
		.attr("height", yScale.bandwidth())
		.attr("fill", style.leftBarColor);

	// Right bars for jury points
	var rightBarGroup = chartGroup.append("g")
		.attr("transform", `translate(${rightBegin},0)`);

	rightBarGroup.selectAll(".bar.right")
		.data(data)
		.enter()
		.append("rect")
		.attr("class", "bar right")
		.attr("x", 0)
		.attr("y", d => yScale(d.to_country))
		.attr("width", d => xScaleRight(d.jury_points)) // Fixed width calculation
		.attr("height", yScale.bandwidth())
		.attr("fill", style.rightBarColor);

	// Add  labels
	chartGroup.selectAll(".label.middle")
		.data(data)
		.enter()
		.append("text")
		.attr("class", "label middle")
		.attr("x", w / 2) // Centered horizontally in the gap
		.attr("y", d => yScale(d.to_country) + yScale.bandwidth() / 2) // Vertically centered in the band
		.attr("dy", "0.35em") // Offset for baseline alignment
		.attr("text-anchor", "middle")
		.text(d => d.to_country);

	// Axes
	var yAxisLeft = d3.axisRight(yScale).tickSize(0).tickFormat('');
	var yAxisRight = d3.axisLeft(yScale).tickSize(0).tickFormat('');

	var xAxisLeft = d3.axisBottom(xScaleLeft).ticks(5);
	var xAxisRight = d3.axisBottom(xScaleRight).ticks(5);

	chartGroup.append("g")
		.attr("class", "axis y left")
		.attr("transform", `translate(${leftBegin},0)`)
		.call(yAxisLeft);

	chartGroup.append("g")
		.attr("class", "axis y right")
		.attr("transform", `translate(${rightBegin},0)`)
		.call(yAxisRight);

	chartGroup.append("g")
		.attr("class", "axis x left")
		.attr("transform", `translate(0,${h})`)
		.call(xAxisLeft);

	chartGroup.append("g")
		.attr("class", "axis x right")
		.attr("transform", `translate(${rightBegin},${h})`)
		.call(xAxisRight);

	// Label  televote axis (left)
	chartGroup.append("text")
		.attr("class", "label axis-left")
		.attr("x", leftBegin / 2) // Position within the left sector
		.attr("y", h + 40) // Slightly below the x-axis
		.attr("text-anchor", "middle")
		.text("Televote");

	// Label  jury vote axis (right)
	chartGroup.append("text")
		.attr("class", "label axis-right")
		.attr("x", rightBegin + sectorWidth / 2) // Position within the right sector
		.attr("y", h + 40) // Slightly below the x-axis
		.attr("text-anchor", "middle")
		.text("Jury Vote");


	var tooltipDiv = d3.select(target)
		.append("div") // Append tooltip to the target container
		.attr("class", "tooltip")
		.style("position", "absolute")
		.style("opacity", 0)
		.style("pointer-events", "none") // Avoid blocking interactions
		.style("background", style.tooltipBG)
		.style("color", style.tooltipColor)
		.style("padding", "5px")
		.style("border", "1px solid #ccc")
		.style("border-radius", "5px");

	svg.selectAll("rect")
		.on("mouseover", function(event, d) {
			const [x, y] = d3.pointer(event, svg.node()); // Get mouse position relative to the SVG
			tooltipDiv
				.transition()
				.duration(200)
				.style("opacity", 0.9);
			tooltipDiv
				.html(
					`<strong>${d.to_country}</strong><br/>
                    Tele Points: ${d.tele_points}<br/>
                    Jury Points: ${d.jury_points}`
				)
				.style("left", `${x + 10}px`) // Adjust for tooltip width
				.style("top", `${y + 10}px`); // Adjust for tooltip height
		})
		.on("mousemove", function(event) {
			const [x, y] = d3.pointer(event, svg.node()); // Update position
			tooltipDiv
				.style("left", `${x + 10}px`)
				.style("top", `${y + 10}px`);
		})
		.on("mouseout", function() {
			tooltipDiv.transition().duration(500).style("opacity", 0);
		});
}

// Call the function
d3.csv("data/sampledatapiramid.csv").then(data => {
	data.forEach(d => {
		d.tele_points = +d.tele_points;
		d.jury_points = +d.jury_points;
	});

	// Sort
	data.sort((a, b) => a.total_points - b.total_points);

	pyramidBuilder(data, "#piramid-container", { width: 800, height: 500 });
});
