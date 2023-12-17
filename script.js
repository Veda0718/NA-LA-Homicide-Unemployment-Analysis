// dimension of the page
const window_dims = {
    width: window.innerWidth,
    height: window.innerHeight
};


const svgWidth = window_dims.width*1.2;
const svgHeight = window_dims.height*1.2;
// Append an SVG element to body, then append a path for the boundaries

const final_data = "./data/output/final_data.geojson"

Promise.all([d3.json(final_data),]).then(data =>
    {
        const final_data = data[0];
    
        const generateMap1 = (data,containerName,width,height,margin=30)=> {
            const svg = d3.select(containerName).append("svg")
            .attr("width", width-380)
            .attr("height", height-350)
            .attr("viewBox", "0 0 800 800"); 

        const projections = [
            d3.geoAzimuthalEqualArea(), //Azimuthal projections project the sphere directly onto a plane.
            d3.geoAlbersUsa(), // USA conic projection
            d3.geoAlbers(), // equal-area conic projection
            d3.geoMercator(), // cylindrical projection
            d3.geoNaturalEarth1(), // pseudocylindrical projection designed by Tom Patterson
            d3.geoEqualEarth(), // Equal Earth projection, by Bojan Šavrič et al., 2018.
            d3.geoConicEqualArea(), //equal-area conic projection
            d3.geoEquirectangular(), //Cylindrical Projections
            d3.geoOrthographic()
        ]
        const max_year = d3.max(data.features.map(feature => feature.properties.Year));

        const filteredData = data.features.filter(d => d.properties.Year === max_year);

        const geoPath_generator = d3.geoPath()
            .projection(projections[3].fitSize([width-900,height-150], data))
            
        const colorInterpolator = d3.interpolateRgbBasis(["#d73027", "#fc8d59", "#fee08b", "#d9ef8b", "#91cf60", "#1a9850"].reverse())
        
        const logScale = d3.scaleLog()
            .domain(d3.extent(filteredData, d => d.properties.homicide_rate))
            .range([0, 1]);

        const tooltip = d3.select("#tooltip");  

        const tooltip2 = d3.select("#tooltip2");  
        
        function tooltip_html(dataForChart){
            const parseYear = d3.timeParse("%Y");
            const filteredData = dataForChart.filter(d => d.properties.homicide_rate !== 0 && d.properties.unemployment_rate !== 0).map(d => {
                return {
                        ...d,
                        properties: {
                            ...d.properties,
                            Year: parseYear(d.properties.Year.toString())
                        }
                };
            });
            let margin={x:20,y:0}
            let plot_height = 120
            let height = 200;
            let width = 300;

            // Create a container for the tooltip SVG
            const tooltipContainer = d3.select("#tooltip").append("div");
            tooltipContainer.attr("class", "tooltip-container");

            // Remove existing SVG element if it exists
            d3.select("#tooltip .tooltip-container > svg").remove();
            let svg_tooltip = tooltipContainer.append("svg").attr("width", width).attr("height", height);
    
            svg_tooltip.attr("viewBox",`0 0 300 200`)    
            // Adding scale for the axis
            svg_tooltip.append('g').attr("transform",`translate(${margin.x},${margin.y})`)
                .append("text")
                .attr("x",115)
                .attr('y',20)
                .text(filteredData[0].properties.Entity)
                .attr("text-anchor","middle")
                .attr("class","country_name")
                .style("font-weight","bold");

            const year_min_max = d3.extent(filteredData, function(d) { 
                return (d['properties']['Year']); 
            })
            const max_values = d3.max(filteredData, function(d) { 
                return Math.max(d['properties']['homicide_rate'], d['properties']['unemployment_rate']); 
            })
    
            const min_max_values = [0, max_values];
            const xScale = d3.scaleTime()
                .domain(year_min_max)
                .range([0, 250]);

            const x_axis_values = [1991, 1995, 2001, 2005, 2011, 2015, 2021]    
    
            const yScale = d3.scaleLinear()
                .domain(min_max_values)
                .range([plot_height,0]);
    
            // adding axis for Line chart
            let formatValue = d3.format(".1s");
            const xAxis = d3.axisBottom(xScale).tickValues(parseYear(x_axis_values.toString()))
            const yAxis = d3.axisLeft(yScale).ticks(7).tickFormat(function(d) { return formatValue(d)});
    
            // appending axis to the View Box
            svg_tooltip.append('g').attr("class",'small-axis')
                .attr("transform",`translate(${margin.x},${plot_height+50})`)
                .call(xAxis);
    
            svg_tooltip.append('g').attr("class",'small-axis')
                .attr("transform",`translate(${margin.x},${50})`)
                .call(yAxis);
    
            // line generator
            var multiline = function(i) {
            var line = d3.line()
                .x(function(d,i){return xScale(d['properties']['Year']);})
                .y(function(d){return yScale(d['properties'][i]);})
            return line;
            }
    
            var g = svg_tooltip.append("g").attr("transform", `translate(${margin.x},${margin.y+50})`);
    
            var categories = ['homicide_rate', 'unemployment_rate'];
    
            var color = d3.scaleOrdinal(d3.schemeCategory10);
    
            for (var i = 0; i < categories.length; i++) {
                var line_function = multiline(categories[i]);
    
                g.append("path")
                    .datum(filteredData) 
                    .attr("class", "line")
                    .style("stroke", color(i))
                    .style("stroke-width", 2)
                    .attr("d", line_function)
                    .attr("fill", 'none');
            }

            // Y axis label
            svg_tooltip.append("text")
                .attr("transform", "rotate(-90)")
                .attr("x", -30)
                .attr("y", 15)
                .style("text-anchor", "middle")
                .text("Value")
                .attr("font-size","8pt")
                .attr("font-weight","bold")
                .attr("font-family","sans-serif");
    
            // X axis label
            svg_tooltip.append("text")
                .attr("x", 150)
                .attr("y", 200)
                .style("text-anchor", "right")
                .text("Year")
                .attr("font-size","8pt")
                .attr("font-weight","bold")
                .attr("font-family","sans-serif");
    }

        function updateVisualization(filteredbyyear) {

            svg.selectAll("text").remove();

            svg.append("text")
            .attr("x", 450)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .attr("font-size", "30px")
            .attr("font-weight","bold")
            .text("Geospatial map for Homicide Rate, " + filteredbyyear[0].properties.Year);   

            const linearScale = d3.scaleLinear()
            .domain(d3.extent(filteredbyyear, d => d.properties.homicide_rate))
            .range([0, 1]);

            const paths = svg.selectAll("path")
                .data(filteredbyyear, d => d.properties.Entity); 
            
            // Remove paths that are no longer needed
            paths.exit().remove();

            paths.enter()
            .append("path")
            .merge(paths)
            .attr("d", d => geoPath_generator(d))
            .attr("fill", "grey")
            .attr("fill", d => d['properties']['homicide_rate'] === 0 ? 'grey' : colorInterpolator(linearScale(d['properties']['homicide_rate'])))
            .on("mouseenter", (m, d) => {
                const CountryData = data.features.filter(item => item.properties.Entity === d.properties.Entity);
                tooltip_html(CountryData)
                d3.select("#tooltip").style("left", 1180 + "px")
                    .style("top", 300 + "px").transition()
                        .duration(200)
                        .style("opacity", .9)
                tooltip2.transition()
                        .duration(200)
                        .style("opacity", .9)
                tooltip2.html(`<b>Country:</b> ${d['properties']['Entity']}<br>` +
                            `<b>Year:</b> ${d['properties']['Year']}<br>` +
                            `<b>Homicide rate:</b> ${d['properties']['homicide_rate']}<br>`)
                        .style("left", 10+m.pageX + "px")
                        .style("top", 10+m.pageY + "px");        
                
            })
            .on("mousemove", (m, d) => {
                tooltip.style("opacity", .9);
                tooltip2.style("opacity", .9);
            })
            .on("mouseout", (m, d) => {
                tooltip.transition()
                    .duration(400)
                    .style("opacity", 0)
                tooltip2.transition()
                    .duration(400)
                    .style("opacity", 0)    
            })
            .on("click", function(event, d){
                // Open the trend charts when the chart element is clicked
                if (d && d.properties && d.properties.Entity) {
                    const clickedEntity = d.properties.Entity;
                    const filteredData = data.features.filter(item => item.properties.Entity === clickedEntity);
                    // Create the three charts for the filtered data
                    drawLineChart(filteredData);
                    createCharts(filteredData);
                } else {
                    console.error("Entity property not found in clicked data:", d);
                }
            })
        }

        updateVisualization(filteredData);

        function drawLegend(colorScale, filteredData, svg, width, height) {
            // Remove existing legend items
            svg.selectAll(".legend-item").remove();

            const filteredLegendData = filteredData.filter(d => d.properties.homicide_rate > 0);

            const legendArea = svg.append("g")
                .attr("class", "legend")
                .attr("transform", `translate(${width - 100},${height - 150})`);

            const linearScale = d3.scaleLinear()
                .domain(d3.extent(filteredLegendData, d => d.properties.homicide_rate))
                .range([0, 1]);    
        
            const legend = legendArea.selectAll(".legend-item")
                .data(d3.range(0, 1.1, 0.1))
                .enter().append("g")
                .attr("class", "legend-item")
                .attr("transform", (d, i) => `translate(0,${i * 20})`);
        
            legend.append("rect")
                .attr("x", 10) 
                .attr("width", 25) 
                .attr("height", 20) 
                .style("fill", d => colorScale(d));  
        
            legend.append("text")
                .attr("x", 50) 
                .attr("y", 9) 
                .attr("dy", ".35em")
                .style("text-anchor", "start")
                .text(d => `${Number(linearScale.invert(d)).toFixed(3)}`); 
        
            // Add a title for the legend
            legendArea.append("text")
                .attr("x", -15) 
                .attr("y", -10) 
                .style("font-size","18px")
                .style("font-weight", "bold")
                .text("Homicide Rate");
        }      

        //drop down    
        const yearDropdown = d3.select("#year-dropdown");

        const years = new Set();
            
        data.features.forEach(feature => {
            if (feature.properties && feature.properties.Year) {
                years.add(feature.properties.Year);
            }
        });

        const sortedYears = Array.from(years).sort((a, b) => b - a); // Sort the years in descending order

        sortedYears.forEach(year => {
            yearDropdown.append("option")
                .attr("value", year)
                .text(year);
        });
        yearDropdown.on("change", function () {
            
            const selectedYear = d3.select(this).property("value");
            const filteredByYear = data.features.filter(d => d.properties.Year === +selectedYear);
            // Use filteredByYear in your visualization or update as needed
            updateVisualization(filteredByYear);
            // Redraw the legend with the updated data
            drawLegend(colorInterpolator, filteredByYear, svg, width - 2500, height - 500);
        })

        drawLegend(colorInterpolator, filteredData, svg, width - 2500, height - 500);

        }

        generateMap1(final_data,".fig1",svgWidth,svgHeight)

    })
    
    function drawLineChart(dataForChart){
        const parseYear = d3.timeParse("%Y");
        const filteredData = dataForChart.filter(d => d.properties.homicide_rate !== 0 && d.properties.unemployment_rate !== 0).map(d => {
            return {
                    ...d,
                    properties: {
                        ...d.properties,
                        Year: parseYear(d.properties.Year.toString())
                    }
            };
        });
    
            let margins = {top: 10, bottom: 30, left: 50, right: 40}
            let height = 600;
            let width = 1000;
    
            d3.select(".fig2").select("svg").remove();
    
            let svg2 = d3.select(".fig2").append("svg")
                            .attr("width", width-100)
                            .attr("height", height-100)
                            .style("align", "center")
    
            svg2.attr("viewBox",`0 0 ${width} ${height}`)    
            // Adding scale for the axis
            svg2.append("text")
                .attr("x", margins.left +450 )
                .attr("y", margins.top+10)
                .attr("text-anchor", "middle")
                .attr("font-size", "30px")
                .attr("font-weight","bold")
                .text("Trend Chart for " + filteredData[0].properties.Entity);    
            
            const year_min_max = d3.extent(filteredData, function(d) { 
                return (d['properties']['Year']); 
            })
            const max_values = d3.max(filteredData, function(d) { 
                return Math.max(d['properties']['homicide_rate'], d['properties']['unemployment_rate']); 
            })
    
            let min_max_values = [0, max_values];
    
            let xScale = d3.scaleTime()
                .domain(year_min_max)
                .range([margins.left - 200, 750 - margins.right]);
    
            const yScale = d3.scaleLinear()
                .domain(min_max_values)
                .range([700-margins.bottom,margins.top+100]);
    
            // adding axis for Line chart
            const xAxis = d3.axisBottom().scale(xScale);
            const yAxis = d3.axisLeft().scale(yScale);
    
            // appending axis to the View Box
            svg2.append('g').attr("class",'axis')
                .attr("transform",`translate(${margins.left+150},${height-margins.bottom})`)
                .call(xAxis);
    
            svg2.append('g').attr("class",'axis')
                .attr("transform",`translate(${margins.left},${margins.top-110})`)
                .call(yAxis);
    
            // line generator
            var multiline = function(i) {
            var line = d3.line()
                .x(function(d){return xScale(d['properties']['Year']);})
                .y(function(d){return yScale(d['properties'][i]);})
            return line;
            }
    
            var g = svg2.append("g").attr("transform", `translate(${margins.left+150}, -90)`);
    
            var categories = ['homicide_rate', 'unemployment_rate'];
    
            var color = d3.scaleOrdinal(d3.schemeCategory10);

            const tooltip = d3.select("body").append("div")
                                .attr("class", "tooltip")
                                .style("opacity", 0);

            // Create data points for homicide_rate
            g.selectAll(".homicide-rate-points")
                .data(filteredData)
                .enter()
                .append("circle")
                .attr("class", "homicide-rate-points")
                .attr("cx", d => xScale(d.properties.Year))
                .attr("cy", d => yScale(d.properties.homicide_rate))
                .attr("r", 5) 
                .attr("fill", color(0)) 
                .style("opacity", .9);

            // Create data points for unemployment_rate
            g.selectAll(".unemployment-rate-points")
                .data(filteredData)
                .enter()
                .append("circle")
                .attr("class", "unemployment-rate-points")
                .attr("cx", d => xScale(d.properties.Year))
                .attr("cy", d => yScale(d.properties.unemployment_rate))
                .attr("r", 5) 
                .attr("fill", color(1)) 
                .style("opacity", .9);
    
            for (var i = 0; i < categories.length; i++) {
                var line_function = multiline(categories[i]);
                g.append("path")
                    .datum(filteredData) 
                    .attr("class", "line")
                    .style("stroke", color(i))
                    .style("stroke-width", 4)
                    .attr("d", line_function)
                    .attr("fill", 'none')
                    // .on("mouseover", function (event,d) {

                    //     g.selectAll(".homicide-rate-points")
                    //         .style("opacity", .9)
                    //         .transition()
                    //         .duration(200);

                    //     g.selectAll(".unemployment-rate-points")
                    //         .style("opacity", .9)
                    //         .transition()
                    //         .duration(200);
                    //   })
                    // .on("mousemove", (m, d) => {
                    //     tooltip_line.style("opacity", .9)
                    // })
                    // .on("mouseout", function (d) {
                    //     g.selectAll(".homicide-rate-points")
                    //         .transition()
                    //         .duration(400)
                    //         .style("opacity", 0);
                  
                    //     g.selectAll(".unemployment-rate-points")
                    //         .transition()
                    //         .duration(400)    
                    //         .style("opacity", 0);
                        
                    //   });
            }

            // Y axis label
            svg2.append("text")
                .attr("transform", "rotate(-90)")
                .attr("x", (-height)+550)
                .attr("y", margins.left-35)
                .style("text-anchor", "middle")
                .text("Value")
                .attr("font-size","20pt")
                .attr("font-weight","bold")
                .attr("font-family","sans-serif");
    
            // X axis label
            svg2.append("text")
                .attr("x", width - margins.right-30)
                .attr("y", height - margins.bottom + 15)
                .style("text-anchor", "right")
                .text("Year")
                .attr("font-size","20pt")
                .attr("font-weight","bold")
                .attr("font-family","sans-serif");
            
            // Creating a legend.
            const legends = g.append("g")
                .attr("transform",`translate(${margins.left+350},${margins.top+100})`)
                .selectAll(".legends")
                .data(categories)
                .enter().append("g")
                .attr("transform",(_,i)=>`translate(${i+200},${i*55})`)
                .attr("class","legends")
                
            legends.append("rect")
                .attr("width","40px")
                .attr("height","20px")
                .attr("rx","8px")
                .attr("fill", (_,i)=>color(i))
                .style("stroke", "black")
                .style("stroke-width", 1.5);
    
            legends.append("text")
                .text(function(d){ return d;})
                .attr("dy","16")
                .attr("dx","50")
                .attr("fill","black")
                .style("alignment-baseline", "middle")
                .style("font-weight", "bold")
                .style("font-size", "20px")
    }

function createCharts(dataForCharts){
                const dataForChart = dataForCharts

                const homicideColorScale = d3.scaleLinear()
                    .domain(d3.extent(dataForChart, d => d.properties.homicide_rate))
                    .range(['#fff', '#f00']);

                const unemploymentColorScale = d3.scaleLinear()
                    .domain(d3.extent(dataForChart, d => d.properties.unemployment_rate))
                    .range(['#fff', '#00f']);

                const yearScale = d3.scaleOrdinal(d3.schemeCategory10)
                    .domain(dataForChart.map(d => d.properties.Year)) 
                    .range(['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b']);  

                createScatterPlot(dataForChart, yearScale);
                createBarChart(dataForChart, homicideColorScale);
                createColumnChart(dataForChart, unemploymentColorScale);

        function createScatterPlot(data, yearScale) {
            const chartScatter = echarts.init(document.querySelector('#scatterChart'));
            // Define chart options for the scatterplot
            const optionsScatterPlot = {
                title: {
                text: `Homicide Rate vs. Unemployment Rate - ${data[0].properties.Entity}`,
                left: 'center',
                textStyle: {
                    fontSize: 20,
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 'bold',
                    textAlign: 'center',
                },
                // padding: 10,
                },
                xAxis: {
                axisLine: {
                    show: true,
                    lineStyle: {
                    color: '#000',
                    },
                },
                axisTick: {
                    show: true,
                    lineStyle: {
                    color: '#000',
                    },
                },
                name: 'Unemployment Rate',
                type: 'value',
                },
                yAxis: {
                axisLine: {
                    show: true,
                    lineStyle: {
                    color: '#000',
                    },
                },
                name: 'Homicide Rate',
                type: 'value',
                },
                series: [
                {
                    name: 'Homicide vs. Unemployment',
                    type: 'scatter',
                    data: data.map((item) => [
                        item.properties.unemployment_rate,
                        item.properties.homicide_rate,
                        item.properties.Year,
                    ]),
                    itemStyle: {
                    color: (params) => yearScale(params.value[2]), 
                    },
                },
                ],
                visualMap: {
                type: 'continuous',
                min: d3.min(data, (d) => d.properties.Year),
                max: d3.max(data, (d) => d.properties.Year),
                inRange: {
                    color: yearScale.range(),
                },
                // Modified properties to position legend at top right
                orient: 'horizontal',
                right: 10,
                top: 10,
                },
                tooltip: {
                trigger: 'item',
                formatter: (params) => {
                    return `Year: ${params.data[2]}<br>Homicide Rate: ${parseFloat(params.data[1]).toFixed(2)}<br>Unemployment Rate: ${params.data[0]}`;
                },
                },
            };

            // Render the scatterplot 
            chartScatter.setOption(optionsScatterPlot);
            }

                  
        function createBarChart(data, homicideColorScale) {
            const chartBar = echarts.init(document.querySelector('#chart1'));

            // Define the chart options for the bar chart
            const optionsBarChart = {
                itemStyle: {
                    border: '2px solid #060',
                },
                title: {
                    text: `Bar Chart for the Homicide rates - ${data[0].properties.Entity}`,
                    textStyle: {
                        fontSize: 18,
                        fontFamily: 'Arial, sans-serif',
                        fontWeight: 'bold',
                        textAlign: 'center',
                    },
                    padding: 10,
                },
                xAxis: {
                    axisLine: {
                        show: true,
                        lineStyle: {
                            color: '#000',
                        },
                    },
                    axisTick: {
                        show: true,
                        lineStyle: {
                            color: '#000',
                        },
                    },
                    type: 'value',
                },
                yAxis: {
                    axisLine: {
                        show: true,
                        lineStyle: {
                            color: '#000',
                        },
                    },
                    type: 'category',
                    data: data.map(item => item.properties.Year),
                },
                series: [
                    {
                        name: 'Homicide Rate',
                        type: 'bar',
                        data: data.map(item => ({
                            value: item.properties.homicide_rate, // Use homicide_rate as the value
                            itemStyle: {
                                color: homicideColorScale(item.properties.homicide_rate), // Use the color scale
                                borderColor: '#000',
                                borderWidth: 2,
                            },
                        })),
                    },
                ],
                visualMap: {
                    type: 'continuous',
                    min: d3.min(data, (d) => d.properties.homicide_rate),
                    max: d3.max(data, (d) => d.properties.homicide_rate),
                    inRange: {
                        color: homicideColorScale.range(),
                    },
                    // position the legend at top right
                    orient: 'horizontal',
                    right: 10,
                    top: 10,
                    // Add event listener for legend item clicks
                    selected: function (index) {
                        const selectedYear = data[index].properties.Year;
                        const filteredData = data.filter(item => item.properties.Year === selectedYear);
                        createBarChart(filteredData, homicideColorScale);
                    },
                },
                tooltip: {
                    trigger: 'item',
                },
            };

            // Render the chart again.
            chartBar.setOption(optionsBarChart);
        }
   
        function createColumnChart(data, unemploymentColorScale) {
        const chartColumn = echarts.init(document.querySelector('#chart2'));

        // Define the chart options for the column chart
        const optionsColumnChart = {
            itemStyle: {
                border: '2px solid #000',
            },
            title: {
                text: `Column Chart for the Unemployment rates - ${data[0].properties.Entity}`,
                textStyle: {
                    fontSize: 18,
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 'bold',
                    textAlign: 'center',
                },
                padding: 10,
            },
            xAxis: {
                axisLine: {
                    lineStyle: {
                        color: '#000',
                    },
                },
                axisTick: {
                    show: true,
                    lineStyle: {
                        color: '#000',
                    },
                },
                type: 'category',
                data: data.map(item => item.properties.Year),
            },
            yAxis: {
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: '#000',
                    },
                },
                type: 'value',
            },
            series: [
                {
                    name: 'Unemployment Rate',
                    type: 'bar',
                    data: data.map(item => item.properties.unemployment_rate),
                    itemStyle: {
                        color: (params) => unemploymentColorScale(params.value),
                        borderColor: '#000',
                        borderWidth: 2,
                    },
                },
            ],
            visualMap: {
                type: 'continuous',
                min: d3.min(data, (d) => d.properties.unemployment_rate),
                max: d3.max(data, (d) => d.properties.unemployment_rate),
                inRange: {
                    color: unemploymentColorScale.range(),
                },
                orient: 'horizontal',
                right: 10,
                top: 10,
                selected: function (index) {
                    const selectedYear = data[index].properties.Year;
                    const filteredData = data.filter(item => item.properties.Year === selectedYear);
                    createColumnChart(filteredData, unemploymentColorScale);
                },
            },
            tooltip: {
                trigger: 'item',
            },
        };

            // Set the chart options and render the chart
            chartColumn.setOption(optionsColumnChart);
            }
        }
    


