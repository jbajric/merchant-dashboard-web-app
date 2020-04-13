import React from 'react';
import { Line } from 'react-chartjs-2';
import Axios from 'axios';
import { getToken } from '../auth.js';
import '../App.css';
import {DatePicker,Select, List, message} from 'antd';

const Moment = require('moment');
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);

const { RangePicker } = DatePicker;
const { Option } = Select;
const dateFormat = "DD.MM.YYYY";


let startDate, endDate = "";
let nizDatumaLabel = [];
let nazivPoslovnice = "";

function onBlur() {}
 
function onFocus() {}
 
function onSearch(val) {}

function rasponDatuma(pocetni, krajnji) {
  const start = moment(pocetni);
  const end = moment(krajnji);
  const range = moment.range(start, end);
  const nizDatuma = Array.from(range.by('days'));
  let result = []
  for (let i = 0; i < nizDatuma.length; i++) {
    let dan = nizDatuma[i]._d.getDate();
    if (dan < 10)
      dan = '0'+dan;
    let mjesec = nizDatuma[i]._d.getMonth()+1;
    if (mjesec < 10)
      mjesec = '0'+mjesec;
    let godina = nizDatuma[i]._d.getFullYear();
    result.push(dan+"."+mjesec+"."+godina);
  }
  startDate = result[0];
  endDate = result[result.length-1];
  return result;
}

function disabledDate(current) {
  return current > moment().endOf('day');
}
 
class Statistics extends React.Component{

  onFinish = values => {
    this.onChange(values)
  };

  state = {
      poslovnice: [],
      chartData: [],
  };

  componentDidMount() {
    nizDatumaLabel = [];
    this.fetchShops(res => {
      this.setState({
        poslovnice: res,
      });
    });
  };  

  onChangeDate = values =>{
    if (!values) {
      nizDatumaLabel = [];
      return;
    }
    nizDatumaLabel = rasponDatuma(values[0]._d,values[1]._d);
    this.onChange(nazivPoslovnice);
  }

  round(value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

  onChange = id => {
    nazivPoslovnice = id;
    this.setState({allReceipts: [], chartData: [], uposlenici: []});
    Axios
        .post(`https://main-server-si.herokuapp.com/api/receipts/filtered`, 
              { from: startDate, to: endDate,},
              { headers: { Authorization: 'Bearer ' + getToken()}}
              ).then((allReceipts) => {
                Axios
        .get(`https://main-server-si.herokuapp.com/api/business/offices/${id}/cashRegisters`, { headers: { Authorization: 'Bearer ' + getToken() } })
        .then(response => {
          if (nizDatumaLabel.length) {
            let newDataArray = [];
            this.setState({
            chartData: newDataArray,
          });
          let filtriraniRacuni = allReceipts.data;

          let labeleKasa      = [];
          let vrijednostiKasa = [];
          let mapaUposlenika  = new Map();

          for (let k=0; k<response.data.length; k++) {
            labeleKasa.push(response.data[k].name);

          let mapaNovca = new Map();
          
          let iznos = 0;
          for (let datum in nizDatumaLabel) 
            mapaNovca.set(nizDatumaLabel[datum],iznos);
          for (let i = 0; i < filtriraniRacuni.length; i++) {
            if (filtriraniRacuni[i].cashRegisterId == response.data[k].id) {
              let date = moment(filtriraniRacuni[i].timestamp).format("DD.MM.YYYY");
              let oldInfo = mapaNovca.get(date);
              let noviIznos = oldInfo+filtriraniRacuni[i].totalPrice;
              noviIznos = this.round(noviIznos,2);
              mapaNovca.set(date,noviIznos);
              if (!mapaUposlenika.has(filtriraniRacuni[i].username)) {
                mapaUposlenika.set(filtriraniRacuni[i].username,0);
              }
              else {
                let a = mapaUposlenika.get(filtriraniRacuni[i].username);
                let b = a+filtriraniRacuni[i].totalPrice;
                b = this.round(b,2);
                mapaUposlenika.set(filtriraniRacuni[i].username,b);
              }
            }
          }
          let vrijednosti = []
          for (let i = 0; i < nizDatumaLabel.length; i++) 
            vrijednosti.push(mapaNovca.get(nizDatumaLabel[i]));

          vrijednostiKasa.push(vrijednosti);
        }
          let tries = 0;
          document.getElementById('employeesTraffic').innerHTML = "";
          for (let username of mapaUposlenika.keys())  {
            tries++;
            document.getElementById('employeesTraffic').innerHTML += "<br/> Employee " + username + " has " + mapaUposlenika.get(username) + " KM" + " of traffic.";
          }
          if (tries) 
            document.getElementById('trafficH2').innerHTML = "Total traffic by employees: ";
          else {
            document.getElementById('employeesTraffic').innerHTML = "";
            document.getElementById('trafficH2').innerHTML = "No traffic recorded";
          }

          
            let datasetsKasa = [];
            let boje = ['#DAA520', 'rgba(255, 0, 0, 0.3)', 'rgba(0, 255, 0, 0.3)', 'rgba(0, 0, 255, 0.3)'];
          
            for (let i = 0; i < response.data.length; i++) {
              let newDataset = {
                label: labeleKasa[i],
                    fill: false,
                    lineTension: 0.8,
                    backgroundColor: 'rgba(75,192,192,0.4)',
                    borderColor: boje[i%4], //GoldenRod
                    borderCapStyle: 'butt',
                    borderDash: [],
                    borderDashOffset: 0.0,
                    borderJoinStyle: 'miter',
                    pointBorderColor: 'rgba(75,192,192,1)',
                    pointBackgroundColor: '#fff',
                    pointBorderWidth: 1,
                    pointHoverRadius: 4,
                    pointHoverBackgroundColor: 'rgba(75,192,192,1)',
                    pointHoverBorderColor: 'rgba(220,220,220,1)',
                    pointHoverBorderWidth: 2,
                    pointRadius: 4,
                    pointHitRadius: 10,
                    data: vrijednostiKasa[i]
              }
              datasetsKasa.push(newDataset);
            }
            let newData = {
              id: response.data[0].id,
              cashRegisterName: response.data[0].name,
              barData: {
                labels: nizDatumaLabel,
                datasets: datasetsKasa
                
              },
              barOptions: {
                title: {
                  display: true,
                  text: "Cash registers"
                },
                legend: {
                  display: true
                }
              }
            }
            newDataArray.push(newData);
          
          Axios
          .get(`https://main-server-si.herokuapp.com/api/offices/${id}/employees`, { headers: { Authorization: 'Bearer ' + getToken() } })
          .then(response => {
            this.setState({
              chartData: newDataArray,
          });}).catch(err => console.log(err));
      }})
    }).catch(error => {message.error('No date selected!');});    
  }

  fetchShops = callback => {
      Axios
      .get('https://main-server-si.herokuapp.com/api/business/offices', { headers: { Authorization: 'Bearer ' + getToken() } })
      .then(response => {
          callback(response.data);
      })
      .catch(err => console.log(err));
  };

  render() {
    return (
      <div>
        <div id="naslovNotifikacije">
        <h1>Statistics</h1>
        <div>
          <RangePicker 
            onChange = {this.onChangeDate}
            name={['datum','range']} 
            disabledDate={disabledDate} 
            format = {dateFormat}>
          </RangePicker>
        </div>
        <br/>
        <div id = "selectAdresa">
        <Select
          showSearch
          style={{ width: 250 }}
          placeholder="Select a shop"
          optionFilterProp="children"
          onChange={this.onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onSearch={onSearch}
          filterOption={(input, option) =>
            option.props.children.toString().toLowerCase().indexOf(input.toString().toLowerCase()) >= 0
          }
        >
          {this.state.poslovnice.map(poslovnica => (
              <Option key={poslovnica.id} value={poslovnica.id}>{poslovnica.address}, {poslovnica.city}</Option>))}
        </Select>
        </div>
        </div>
        <h2 id = "trafficH2"/>
        <h3 id = "employeesTraffic"/>
        <div id = "dijagrami">
        <List
          dataSource={this.state.chartData}
          renderItem={item => (
          <List.Item key={item.id}>
              <div id = "graf">
                  <Line redraw={true} data={item.barData} options={item.barOptions}/>
              </div>
          </List.Item>
          )}
          />
          </div>
      </div>
    );
  }
}
 
export default Statistics;