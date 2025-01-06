class Scatterplot {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;

        this.displayData = this.transformData();
    }

    transformData() {
        let composers = [];

        this.data.forEach(d => {
            d.composers.split(';').forEach(function(myString) {
                if(myString && +d.place_contest > 0){
                    composers.push({composer: myString, placement: +d.place_contest});
                }
            })
        });

        const counter = [];

        composers.forEach(ele => {
            let index = counter.findIndex(d => d.composer === ele.composer);
            if(index > -1)
            {
                counter[index].amount += 1;
                counter[index].total_placement += ele.placement;
            }
            else {
                counter.push({composer: ele.composer, amount: 1, total_placement: ele.placement});
            }
        });

        counter.forEach((d) => {
            d.average_placement = d.total_placement/d.amount;
        });

        return counter.filter(d => d.amount > 1);
    }

    initVis(){
        let vis = this;

        vis.margin = {top: 10, right: 30, bottom: 30, left: 30};

        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // append the svg object to the body of the page
        vis.svg = d3.select("#" + vis.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + vis.margin.left + "," + vis.margin.top + ")");


        // Add X axis
        vis.x = d3.scaleLinear()
            .domain([1, d3.max(this.displayData, d => d.amount)])
            .range([ 0, vis.width ]);

        // Add Y axis
        vis.y = d3.scaleLinear()
            .domain([d3.max(this.displayData, d => d.average_placement), 0])
            .range([vis.height, 0]);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y);

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")");

        vis.svg.append("g")
            .attr("class", "y-axis axis");

        vis.updateVis();
    }

    showInformation(data){
        let newData = this.data.filter(d => d.composers.includes(data.composer));
        let wikipediaString = 'https://wikipedia.org/wiki/' + data.composer.replace(' ', '_');

        let tableData =
            {composer: data.composer,
                average_placement: data.average_placement,
            allEntries: newData,
            wikipedia: wikipediaString};


        console.log(tableData);
    }

    updateVis() {
        let vis = this;

        // Draw the layers
        let scatterpoints = vis.svg.selectAll(".dot")
            .data(vis.displayData);

        scatterpoints.enter().append("circle")
            .attr("class", "dot")
            .attr("cx", function (d) { return vis.x(d.amount); } )
            .attr("cy", function (d) { return vis.y(d.average_placement); } )
            .attr("r", 3)
            .style("fill", "#69b3a2")
            .on("click", (e,d) => this.showInformation(d))
            .on("mouseover", function(d) {
                d3.select(this).style("fill", "red");
            })
            .on("mouseout", function(d) {
                d3.select(this).style("fill", "#69b3a2");
            })
            .merge(scatterpoints)

        scatterpoints.exit().remove();

        // Call axis functions with the new domain
        vis.svg.select(".x-axis").call(vis.xAxis);
        vis.svg.select(".y-axis").call(vis.yAxis);
    }
}