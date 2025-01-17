class Scatterplot {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;

        this.displayData = this.transformData([]);
    }

    //Initialise the data that will be used to calculate the amount of times each composer appeared in Eurovision.
    //Creates an array of objects with the following structure:
    /*{
    * Composer: String
    * amount: Int
    * Average_placement: Number
    * Country: String
    * }*/
    initData() {
        let composers = [];

        //Create a list of all composers that ever created a song in Eurovision
        this.data.forEach(d => {
            d.composers.split(';').forEach(function(myString) {
                if(myString && d.place_contest > 0){
                    composers.push({composer: myString, placement: d.place_contest, country: d.to_country});
                }
            })
        });

        const fullComposers = [];

        //Create a list per composer of needed information (composer, amount, average_placement and country)
        composers.forEach(ele => {
            let index = fullComposers.findIndex(d => d.composer === ele.composer);
            if(index > -1)
            {
                fullComposers[index].amount += 1;
                fullComposers[index].total_placement += ele.placement;
                fullComposers[index].country += ";" + ele.country;
            }
            else {
                fullComposers.push({composer: ele.composer, amount: 1, total_placement: ele.placement, country: ele.country});
            }
        });


        fullComposers.forEach((d) => {
            d.average_placement = d.total_placement/d.amount;
        });


        return fullComposers;
    }

    //Filters the data based on the year.
    transformData(filter) {
        let ogData = this.initData();

        //Filter the results based on the year selected
        let filteredResults = ogData;
        if(filter.length > 0) {
            filteredResults = ogData.filter(result => {
                return filter.find(d => d.composers.includes(result.composer));
            })
        }


        //Measure how often an 'amount' appears in the data
        let filterNumber = 0;
        let counter = {};

        filteredResults.forEach((d, i) => {
            if(counter[d.amount]){
                counter[d.amount] += 1;
            }
            else{
                counter[d.amount] = 1;
            }
        });
        // If, for example, in the data more than 75 composers have appeared twice, then that gets removed from the results
        // This is to make it look cleaner
        for (let key in counter){
            if(counter[key] > 75){
                filterNumber = filterNumber > key ? filterNumber : key;
            }
        }

        return filteredResults.filter(d => d.amount > filterNumber);
    }

    //Initialises the scatterplot
    initVis(){
        let vis = this;

        vis.country = "";

        // Init the margings
        vis.margin = {top: 0, right: 30, bottom: 30, left: 30};

        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom - 60;

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
            .domain([d3.min(this.displayData, d => d.amount) - 1, d3.max(this.displayData, d => d.amount)])
            .range([ 0, vis.width ]);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x);

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")");

        // Add Y axis
        vis.y = d3.scaleLinear()
            .domain([d3.max(this.displayData, d => d.average_placement) + 1, 1])
            .range([vis.height, 0]);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y);

        vis.svg.append("g")
            .attr("class", "y-axis axis");

        //Add tooltip
        vis.tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);

        vis.updateVis();
    }

    //Render the necessary data of the composer on the modal
    showInformation(data){
        //Transform the data for rendering on screen
        let newData = this.data.filter(d => d.composers.includes(data.composer));
        let wikipediaString = 'https://wikipedia.org/wiki/' + data.composer.replace(' ', '_');

        let tableData =
            {composer: data.composer,
                average_placement: data.average_placement,
            allEntries: newData,
            wikipedia: wikipediaString};


        //Make the modal appear
        // Get the modal
        let modal = document.getElementById("myModal");
        // Get the <span> element that closes the modal
        let span = document.getElementsByClassName("close")[0];
        modal.style.display = "block";

        //Make the modal closable
        span.onclick = function() {
            modal.style.display = "none";
            deleteInformation();
        }

        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
                deleteInformation();
            }
        }

        //Render the text on  screen
        let table = document.getElementById("composer-table-body");

        tableData.allEntries.forEach(entry => {
            // Get the table and insert a new row at the end
            let newRow = table.insertRow(table.rows.length);

            // Insert data into cells of the new row
            newRow.insertCell(0).innerHTML = entry.year;
            newRow.insertCell(1).innerHTML = entry.performer;
            newRow.insertCell(2).innerHTML = entry.song;
            newRow.insertCell(3).innerHTML = entry.composers.split(';').join(', ');
            newRow.insertCell(4).innerHTML = entry.to_country;
            newRow.insertCell(5).innerHTML = entry.place_contest;
        });
        document.getElementById("composer-table-title").innerHTML += tableData.composer;
        document.getElementById("average-placement").innerHTML += Math.round(tableData.average_placement);
        document.getElementById("wikipedia-link").href = tableData.wikipedia;


        function deleteInformation(){
            //Empty the text on  screen
            let trs = document.querySelectorAll('#composer-table-body tr');

            console.log(trs);

            trs.forEach((tr)=>{
                tr.remove();
            });

            document.getElementById("composer-table-title").innerHTML = "";
            document.getElementById("average-placement").innerHTML = "";
            document.getElementById("wikipedia-link").href = "";
        }
    }



    //Update the scatterplot
    updateVis() {
        let vis = this;

        // get the layers
        let scatterpoints = vis.svg.selectAll(".dot")
            .data(vis.displayData);

        // Update the x axis
        vis.x.domain([d3.min(this.displayData, d => d.amount) - 1, d3.max(this.displayData, d => d.amount)])

        // Update the y axis
        vis.y.domain([d3.max(this.displayData, d => d.average_placement) + 1, 1])

        //Update the scatterplot
        scatterpoints.enter().append("circle")
            .attr("class", "dot")
            .merge(scatterpoints)
            .attr("cx", function (d) { return vis.x(d.amount); } )
            .attr("cy", function (d) { return vis.y(d.average_placement); } )
            .attr("r", 3)
            .style("fill", d => this.colourCountrySelected(d))
            .on("click", (e,d) => this.showInformation(d))
            .on("mouseover", function(e, d) {
                //When hovering change colour + show tooltip
                d3.select(this).style("fill", "pink");

                vis.tooltip.style('opacity', 1)
                    .html(`<strong>Name:</strong> ${d.composer}`)
                    .style('left', (e.pageX + 10) + 'px')
                    .style('top', (e.pageY - 20) + 'px');
            })
            .on("mousemove", function(e, d) {
                vis.tooltip.style('left', (e.pageX + 10) + 'px')
                    .style('top', (e.pageY - 20) + 'px');
            })
            .on("mouseout", function(e, d) {
                //Change colour depending on if a country is selected or not
                d3.select(this).style("fill", data => {
                    if(vis.country && d.country.includes(vis.country)) {
                    return "red";
                }
                    return "#69b3a2";});
                vis.tooltip.style('opacity', 0);
            })
        scatterpoints.exit().transition().remove();

        // Call axis functions with the new domain
        vis.svg.select(".x-axis").transition().call(vis.xAxis);
        vis.svg.select(".y-axis").transition().call(vis.yAxis);
    }

    //Change colour depending on if country is selected or not
    colourCountrySelected(d){
        let vis = this;
        if(vis.country && d.country.includes(vis.country)) {
            return "red";
        }
        return "#69b3a2";
    }
}