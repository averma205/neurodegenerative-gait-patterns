d3.csv("Standard_deviations.csv").then(function(data) {
    const groups = { als: [], hunt: [], park: [], control: [] };
    data.forEach(d => {
        d.value = +d["SD of Left Stride Interval (sec)"];
        if (d.Subject.startsWith("als")) groups.als.push(d.value);
        else if (d.Subject.startsWith("hunt")) groups.hunt.push(d.value);
        else if (d.Subject.startsWith("park")) groups.park.push(d.value);
        else if (d.Subject.startsWith("control")) groups.control.push(d.value);
    });

    function getBoxStats(values) {
        values.sort(d3.ascending);
        const q1 = d3.quantile(values, 0.25);
        const median = d3.quantile(values, 0.5);
        const q3 = d3.quantile(values, 0.75);
        const min = d3.min(values);
        const max = d3.max(values);
        const mean = d3.mean(values);  // Calculate the mean
        return { min, q1, median, q3, max, mean };
    }

    const boxData = Object.keys(groups).map(group => ({
        name: group,
        ...getBoxStats(groups[group]),
        dots: groups[group] // Include the actual dots (SD values)
    }));

    const width = 600, height = 400, margin = { top: 20, right: 30, bottom: 40, left: 100 };
    const svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    const x = d3.scaleLog()
        .domain([d3.min(boxData, d => d.min), d3.max(boxData, d => d.max)])
        .range([0, width]);
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5, ",.1f"))
        .append("text")  // Add x-axis label
        .attr("x", width / 2)
        .attr("y", 35)
        .style("text-anchor", "middle")
        .text("Stride Interval (seconds)");

    const y = d3.scaleBand()
        .domain(["control", "park", "hunt", "als"])
        .range([height, 0])
        .padding(0.5);
    svg.append("g").call(d3.axisLeft(y))
        .append("text")  // Add y-axis label
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .style("text-anchor", "middle")
        .text("Groups");

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    boxData.forEach(d => {
        const yPos = y(d.name) + y.bandwidth() / 2;
        
        svg.append("line")
            .attr("x1", x(d.min)).attr("x2", x(d.max))
            .attr("y1", yPos).attr("y2", yPos)
            .attr("stroke", "black");
        
        svg.append("rect")
            .attr("x", x(d.q1)).attr("width", x(d.q3) - x(d.q1))
            .attr("y", yPos - 10).attr("height", 20)
            // .attr("fill", "#69b3a2")
            .attr("class", `box ${d.name}`)
            .on("mouseover", function(event) {
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`Group: ${d.name}<br>Min: ${d.min}<br>Q1: ${d.q1}<br>Median: ${d.median}<br>Q3: ${d.q3}<br>Max: ${d.max}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition().duration(500).style("opacity", 0);
            });
        
        svg.append("line")
            .attr("x1", x(d.median)).attr("x2", x(d.median))
            .attr("y1", yPos - 10).attr("y2", yPos + 10)
            .attr("stroke", "black");

        // Add dots for the standard deviations
        svg.selectAll(`.dot-${d.name}`)
            .data(d.dots)
            .enter()
            .append("circle")
            .attr("cx", function(value) { return x(value); })
            .attr("cy", yPos)
            .attr("r", 2.5)
            .attr("class", "dot")
            .attr("class", `dot ${d.name}`)
            .on("mouseover", function(event, value) {
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`Standard Deviation: ${value}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition().duration(500).style("opacity", 0);
            });

        // Add the mean annotation next to the box plot
        svg.append("text")
            .attr("x", x(d.mean) - 40)  // Position the text slightly to the right of the mean
            .attr("y", yPos)
            .attr("dy", -20)  // Position above the box plot
            .attr("font-size", "12px")
            .attr("fill", "black")
            .attr('class', 'mean')
            .text(`Mean: ${d.mean.toFixed(2)}`);
    });
});

