function pyramidBuilder(data, target, options, country) {
  const barHeight = options.barHeight || 20;
  const padding = options.padding || 10;
  const numBars = data.length;
  const totalHeight = numBars * (barHeight + padding);
  const fixedHeight = options.height || 400;
  const width = options.width || 500;

  const margin = {
    top: 20,
    right: 0,
    bottom: 60, // Espacio extra para ejes
    left: 0,
    middle: 20,
  };
  const sectorWidth = width / 2 - margin.middle;
  const leftBegin = sectorWidth - margin.left;
  const rightBegin = width - margin.right - sectorWidth;

  const style = {
    leftBarColor: options.style?.leftBarColor || '#006837',
    rightBarColor: options.style?.rightBarColor || '#006837',
    tooltipBG: options.style?.tooltipBG || '#F0F0F0',
    tooltipColor: options.style?.tooltipColor || '#202020',
  };

  const maxValue = Math.ceil(
    Math.max(
      d3.max(data, (d) => d.tele_points),
      d3.max(data, (d) => d.jury_points)
    )
  );

  const xScaleLeft = d3.scaleLinear().domain([0, maxValue]).range([sectorWidth, 0]);
  const xScaleRight = d3.scaleLinear().domain([0, maxValue]).range([0, sectorWidth]);
  const yScale = d3
    .scaleBand()
    .domain(data.map((d) => d.to_country))
    .range([0, totalHeight])
    .padding(0.1);

  const container = d3
    .select(target)
    .style("height", `${fixedHeight}px`)
    .style("overflow-y", "scroll")
    .style("border", "1px solid #ccc");

  const svg = container
    .append('svg')
    .attr('width', width)
    .attr('height', totalHeight + margin.top + margin.bottom);

  const chartGroup = svg
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // --- GRUPO PARA BARRAS IZQUIERDAS (TELEVOTO) ---
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
    // Cambiamos el color si d.to_country === country
    .attr('fill', (d) => d.to_country === country ? 'black' : style.leftBarColor);

  // --- GRUPO PARA BARRAS DERECHAS (JURADO) ---
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
    // Cambiamos el color si d.to_country === country
    .attr('fill', (d) => d.to_country === country ? 'black' : style.rightBarColor);

  // --- TEXTOS EN MEDIO (LABELS) ---
  chartGroup
    .selectAll('.label.middle')
    .data(data)
    .enter()
    .append('text')
    .attr('class', 'label middle')
    .attr('x', width / 2)
    .attr('y', (d) => yScale(d.to_country) + yScale.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', 'middle')
    .text((d) => d.to_country);

  // --- EJES ---
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

  // Label televote axis
  chartGroup
    .append("text")
    .attr("class", "label axis-left")
    .attr("x", leftBegin / 2)
    .attr("y", totalHeight + 35)
    .attr("text-anchor", "middle")
    .text("Televote");

  // Label jury vote axis
  chartGroup
    .append("text")
    .attr("class", "label axis-right")
    .attr("x", rightBegin + sectorWidth / 2)
    .attr("y", totalHeight + 35)
    .attr("text-anchor", "middle")
    .text("Jury Vote");

  // --- TOOLTIP ---
  const tooltipDiv = d3.select(target)
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("opacity", 0)
    .style("pointer-events", "none")
    .style("background", style.tooltipBG)
    .style("color", style.tooltipColor)
    .style("padding", "5px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "5px");

  svg.selectAll("rect")
    .on("mouseover", function (event, d) {
      // Resalta las barras con el mismo país en amarillo
      svg.selectAll("rect")
        .filter((barData) => barData.to_country === d.to_country)
        .attr("fill", "yellow");

      // Muestra tooltip
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
        .style("left", `${x + 1000}px`)
        .style("top", `${y + 15}px`);
    })
    .on("mouseout", function (event, d) {
      // Vuelve a los colores originales (o negro si coincide con 'country')
      svg.selectAll("rect")
        .filter((barData) => barData.to_country === d.to_country)
        .attr("fill", (barData) =>
          // Si coincide con el country que pasamos, lo dejamos en negro
          barData.to_country === country 
            ? 'black'
            : (barData.tele_points === d.tele_points ? style.leftBarColor : style.rightBarColor)
        );

      // Oculta tooltip
      tooltipDiv.transition().duration(500).style("opacity", 0);
    });
}
