let scatterplot;

loadData();
function loadData() {
    d3.csv("resources/contestants.csv").then((csvData) => {
        // prepare data
        let data = csvData;

        scatterplot = new Scatterplot("scatterplot-container", data);

        scatterplot.initVis();
    });
}