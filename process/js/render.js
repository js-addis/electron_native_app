var $ = jQuery = require('jquery');
var lodash = require('lodash');
var bootstrap = require('bootstrap');
var fs = eRequire('fs');
var loadApts = JSON.parse(fs.readFileSync(dataLocation));

var electron = eRequire('electron');
var ipc = electron.ipcRenderer;

var React = require('react');
var ReactDOM = require('react-dom');
var AptList = require('./AptList');
var Toolbar = require('./Toolbar');
var AddAppointment = require('./AddAppointment');
var HeaderNav = require('./HeaderNav');

var MainInterface = React.createClass({

  getInitialState: function() {
    return {
      aptBodyVisible: false,
      orderBy: 'petName',
      orderDir: 'asc',
      queryText: '',
      myAppointments: loadApts
    }
  },

  componentDidMount: function() {
    ipc.on('addAppointment', function(event, message) {
      this.toggleAptDisplay();
    }.bind(this));
  },
  componentWillUnmount: function() {
    ipc.removeListener('addAppointment', function(event, message) {
      this.toggleAptDisplay();
    }.bind(this));
  },

  componentDidUpdate: function() {                                                  // Saves changes on update of data
    fs.writeFile(dataLocation, JSON.stringify(this.state.myAppointments), 'utf8',
    function(err) {
      if(err) {
        console.log(err);
      }
    });
  },

  toggleAptDisplay: function() {
    var tempVisibility = !this.state.aptBodyVisible;
    this.setState({
      aptBodyVisible: tempVisibility
    });
  },

  showAbout: function() {
    ipc.sendSync('openInfoWindow')
  },

  addItem: function(tempItem) {
    var tempApts = this.state.myAppointments;
    tempApts.push(tempItem);
    this.setState({
      myAppointments: tempApts,
      aptBodyVisible: false
    });
  },

  deleteMessage: function(item) {
    var allApts = this.state.myAppointments;
    var newApts = lodash.without(allApts, item);
    this.setState({
      myAppointments: newApts
    });
  },

  reOrder: function(orderBy, orderDir) {
    this.setState({
      orderBy: orderBy,
      orderDir: orderDir
    });
  },

  searchApts: function(query) {
    this.setState({
      queryText: query
    });
  },

  render: function() {
    var myAppointments = this.state.myAppointments;
    var filteredApts = [];
    var queryText = this.state.queryText;
    var orderBy = this.state.orderBy;
    var orderDir = this.state.orderDir;

    if(this.state.aptBodyVisible === true) {
      $('#addAppointment').modal('show');
    } else {
      $('#addAppointment').modal('hide');
    }

    for (var i = 0; i < myAppointments.length; i++) {
      if (
        (myAppointments[i].petName.toLowerCase().indexOf(queryText) != -1) ||
        (myAppointments[i].ownerName.toLowerCase().indexOf(queryText) != -1) ||
        (myAppointments[i].aptDate.toLowerCase().indexOf(queryText) != -1) ||
        (myAppointments[i].aptNotes.toLowerCase().indexOf(queryText) != -1)
      ) {
        filteredApts.push(myAppointments[i]);
      }
    }

    filteredApts = lodash.orderBy(filteredApts, function(item) {
      return item[orderBy].toLowerCase();
    }, orderDir);

    filteredApts = filteredApts.map(function(item, index) {
      return(

        <AptList key = {index}
          singleItem = {item}
          whichItem = {item}
          onDelete = {this.deleteMessage}
        />

      )
    }.bind(this));

    return (

      <div className="application">
        <HeaderNav
          onSearch={this.searchApts}
          orderBy={this.state.orderBy}
          orderDir={this.state.orderDir}
          onReOrder={this.reOrder}
        />
        <div className="interface">
          <Toolbar
            handleToggle = {this.toggleAptDisplay}
            handleAbout = {this.showAbout}
          />
          <AddAppointment
            handleToggle = {this.toggleAptDisplay}
            addApt = {this.addItem}
          />
          <div className="container">
            <div className="row">
              <div className="appointments col-sm-12">
                <h2 className="appointments-headline">Current Appointments</h2>
                <ul className="item-list media-list">

                  {filteredApts}

                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

    );
  }
});

ReactDOM.render(
    <MainInterface />,
    document.getElementById('petAppointments')
);
