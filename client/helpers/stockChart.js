// import { Template } from 'meteor/templating';
// import { ReactiveVar } from 'meteor/reactive-var';
// import { Mongo } from 'meteor/mongo';

// import Events from '../../lib/collections';

Template.priceGraph.rendered = function () {
  var margin = {top: 30, right: 20, bottom: 30, left: 50},
  width = 600 - margin.left - margin.right,
  height = 270 - margin.top - margin.bottom;

  // Parse the date / time
  var parseDate = d3.time.format("%d-%b-%y").parse;

  // Set the ranges
  var x = d3.time.scale().range([0, width]);
  var y = d3.scale.linear().range([height, 0]);

  // Define the axes
  var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom").ticks(5);

  var yAxis = d3.svg.axis()
                    .scale(y)
                    .orient("left").ticks(5);

  // Define the line
  var valueline = d3.svg.line()
                        .x(function(d) { return x(d.date); })
                        .y(function(d) { return y(d.gold); });

  // Adds the svg canvas
  var svg = d3.select("#stockPriceGraph")
              .append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");




  price_data = [];
  // amount_data = [];
  moving_window = 10;
  maxTime = 20111010;


  // function computeCurrentPrice(metalType) {
  //   retval = 50;
  //   if (price_data.length > moving_window) {
  //     windowprice = _.reduce(_.last(price_data,moving_window), function(a,b) { return a + 1.0*b[metalType];},0) / moving_window;
  //     retval = (windowprice + d3.random.normal(windowprice,moving_window)())/2.0;
  //   } else {
  //     retval = (50 + d3.random.normal(50,moving_window)())/2.0;
  //   }
  //   if (retval < 5.0) { retval = 5.0;}
  //   return retval;
  // }
  startLength = 0;
  newLength = 0;
  goldPrices = Events.find({$and: [{"itemNo": "c3"}, {"gameCode": Session.get("GameCode")}, {"key": "StockPriceChange"}]}, {"group": Session.get("GroupNo")}, {sort: {"timestamp": -1}}).map(function (u) {return u.price});
  // console.log(goldPrices);
  currentLength = goldPrices.length;
  if (currentLength > 0)
    moving_window = currentLength - 1
  if (moving_window > 100)
    moving_window = 100

  function initData() {
    // console.log(goldPrices + " " + goldPrices[2]);
    for (i = 0; i < (1 + moving_window); i++) {
      maxTime += 10;
      time = +maxTime * 10000;
      // p_bismuth = computeCurrentPrice('bismuth');
      // p_lead = computeCurrentPrice('lead');
      aTime = new Date(time);
      p_gold = goldPrices[i];

      // console.log(p_gold);
      if (p_gold != undefined){
        price_data.push({'date': aTime, 'gold':p_gold.toString() });
      }
      // amount_data.push({'date': aTime, 'bismuth': 100.0, 'gold':100.0 ,'lead':100.0 });
    }
    startLength = currentLength;
  }

  var b_repeat_toggle = false;

  function repeatToggle() {
    b_repeat_toggle = !b_repeat_toggle;
    repeatUpdate();
  }
  function repeatUpdate() {
    if (b_repeat_toggle) {
      updateAll();
      setTimeout(repeatUpdate,500);
    }
  }

  function updatePriceAndTime() {
    maxTime += 10;
    time = +maxTime * 10000;
    aTime = new Date(time);
    // p_bismuth = computeCurrentPrice('bismuth');
    // p_lead = computeCurrentPrice('lead');
    // p_gold = computeCurrentPrice('gold');
    p_gold = goldPrices[goldPrices.length - 1];
    // console.log(p_gold);
    // p_gold_str = "";
    if (p_gold != undefined)
      return {'date': aTime, 'gold':p_gold.toString() };
  }

  function updateData() {
    price_data.push(updatePriceAndTime());
    if (price_data.length > moving_window*moving_window) {
      price_data.shift();
    }
  }

  function executeBuy(metalType,amt){
    market_diff = -0.05*amt;
    newdata = updatePriceAndTime();
    previous_price = 1.0 * newdata[metalType];
    newdata[metalType] = previous_price + (market_diff * previous_price);
    console.log(newdata);
    price_data.push(newdata);
    if (price_data.length > moving_window*moving_window) {
      price_data.shift();
    }
  }

  function updateBuy(metalType,amt) {
    setTimeout(function () {
      executeBuy(metalType,amt); }
      ,1000);
  }

  function initLine() {
    // Scale the range of the data


    if(price_data[0] != undefined){

      x.domain(d3.extent(price_data, function(d) { return d.date; }));
      y.domain([0, d3.max(price_data, function(d) { return d.gold; })]);

      // Add the valueline path.
      // svg.append("path")
      //    .attr("class", "line")
      //    .attr("d", valueline(price_data));

      // Add the X Axis
      svg.append("g")
         .attr("class", "x axis")
         .attr("transform", "translate(0," + height + ")")
         .call(xAxis);

      // Add the Y Axis
      svg.append("g")
         .attr("class", "y axis")
         .call(yAxis);

      updateAll();
    }

  }

  var d3color = d3.scale.category10();
  var d3line = d3.svg.line()
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.price); });


  function metalLines() {
    svg.selectAll(".metal").remove(); //TODO not, like, great
    svg.selectAll(".legend").remove();

    d3color.domain(d3.keys(price_data[0]).filter(function(key) { return key !== "date"; }));

    metals = d3color.domain().map(function(name) {
      return {
        name: name,
        values: price_data.map(function(d) {
          return {date: d.date, price: +d[name]};
        })
      };
    });

    // function getBB(selection) {
    //     selection.each(function(d){d.bbox = this.getBBox();})
    // }

    metal = svg.selectAll(".metal")
               .data(metals)
               .enter().append("g")
               .attr("class", "metal");

    metal.append("path")
         .attr("class", "line")
         .attr("d", function(d) { return d3line(d.values); })
         .attr("data-legend",function(d) { return d.name; })
         .attr("data-legend-price",function(d) {return Math.round(d.values[d.values.length - 1].price);})
         .style("stroke", function(d) { return d3color(d.name); });

    // legend = svg.append("g")
    //         .attr("class","legend")
    //         .attr("transform","translate(50,0)")
    //         .style("font-size","12px")
    //         .call(d3.legend);
  }



  function updateLine() {
    // console.log(price_data);
    if (price_data[0] != undefined){
      x.domain(d3.extent(price_data, function(d) { return d.date; }));
      y.domain([0, Math.max(25.0, d3.max(price_data, function(d) { return d.gold; }))]);

      // Select the section we want to apply our changes to
      var svgLocal = d3.select("body").transition();

      // Make the changes
      // svgLocal.select(".line")   // change the line
      //    .duration(0)
      //    .attr("d", valueline(price_data));
      svgLocal.select(".x.axis") // change the x axis
         .duration(0)
         .call(xAxis);
      svgLocal.select(".y.axis") // change the y axis
         .duration(0)
         .call(yAxis);
       }
  }

  function killEverything() {
    svg.selectAll(".x.axis").remove();
    svg.selectAll(".y.axis").remove();
  }
  function initAll() {
    killEverything();
    initData();
    initLine();
    // updateAll();
  }

  function updateAll() {
    updateData();
    updateLine();
    metalLines();
  }

  function buyMetal(metalType,amt) {
    console.log("BUY " + metalType + " " + amt);
    updateBuy(metalType,amt);
    updateLine();
    metalLines();
  }

// helper functions
  function sellMetal(metalType,amt) {buyMetal(metalType,amt*-1);}
  function buyGold(amt) {buyMetal('gold',amt);}
  function buyLead(amt) {buyMetal('lead',amt);}
  function buyBismuth(amt) {buyMetal('bismuth',amt);}
  function sellGold(amt) {sellMetal('gold',amt);}
  function sellLead(amt) {sellMetal('lead',amt);}
  function sellBismuth(amt){sellMetal('bismuth',amt);}

  chartItemChanged = false;

  Tracker.autorun(function () {
    var sessionVal = Session.get("StockChartItem");
    console.log("chart item changed: " + sessionVal);
    chartItemChanged = true;
  });
  console.log(Session.get("Role") + " " + Session.get("StockChartItem"));
  if (Session.get("StockChartItem") == undefined){
    Session.set("StockChartItem", "c3");    /// *** MAKE SURE DEFAULT ITEM BEING CHARTED DOES BELONG TO THIS GAME *** ///
  }

  if(Session.get("Role") == "userDash" && Session.get("StockChartItem") != undefined){
    // console.log("entered this condition");
    Tracker.autorun(function () {
      var gp = Events.find({$and: [{"itemNo": Session.get("StockChartItem")}, {"gameCode": Session.get("GameCode")}, {"key": "StockPriceChange"}, {"group": Session.get("GroupNo")}]}, {sort: {"timestamp": -1}}).map(function (u) {return u.price});

      goldPrices = gp;

      currentLength = goldPrices.length;

      // console.log("attempts to work " + startLength + " " + currentLength + " " + goldPrices);


      if (chartItemChanged == true || (startLength == 0 && currentLength != 0)) {
        price_data = [];
        initAll();
        chartItemChanged = false;
        updateAll();
      }

      else if (startLength != currentLength && startLength != 0 && currentLength != 0 && goldPrices[0] != undefined){
        price_data.push({'date': aTime, 'gold':goldPrices[0].toString() });
        // console.log("refresh");
        updateAll(); //*** TODO: update should add all pending values, not just latest value ***///
      }
    });
  }



}
