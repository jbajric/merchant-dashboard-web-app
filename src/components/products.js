import React from 'react';
import 'antd/dist/antd.css';
import InfiniteScroll from 'react-infinite-scroller';
import {Button, Popconfirm, Spin, InputNumber, TreeSelect, Card, List, DatePicker, Input, Tabs, message} from 'antd';
import { getToken } from '../auth';
import Axios from 'axios';
import {QuestionCircleOutlined, DollarOutlined, BarcodeOutlined, FieldNumberOutlined, NumberOutlined } from '@ant-design/icons';
import '../App.css';
import './notifications.css';


const { Search }  = Input;
const { TabPane } = Tabs;

let mapaProizvoda = new Map();
let mapaZahtjeva  = new Map();
let keyMapa = [];
let trenutnoOdabrano = '';
let nizPrijeSearcha;
let requestNizPrijeSearcha;
let currentTab = "Products";


const { RangePicker } = DatePicker;
const dateFormat      = "DD.MM.YYYY";

const Moment      = require('moment');
const MomentRange = require('moment-range');
const moment      = MomentRange.extendMoment(Moment);

var datum = new Date();
var dd    = String(datum.getDate()).padStart(2, '0');
var mm    = String(datum.getMonth() + 1).padStart(2, '0');
var yyyy  = datum.getFullYear();
datum     = dd + "." + mm + "." + yyyy;

let startDate = '01.01.2000', endDate = datum;
let nizDatumaLabel = [];

var IDposlovnice = -1;

function disabledDate(current) {
  return current > moment().endOf('day');
}

function rasponDatuma(pocetni, krajnji) {
  const start = moment(pocetni);
  const end = moment(krajnji);
  const range = moment.range(start, end);
  const nizDatuma = Array.from(range.by('days'));
  let result = []
  for (let i = 0; i < nizDatuma.length; i++) {
    let dan = nizDatuma[i]._d.getDate();
    if (dan < 10)
      dan = '0' + dan;
    let mjesec = nizDatuma[i]._d.getMonth() + 1;
    if (mjesec < 10)
      mjesec = '0' + mjesec;
    let godina = nizDatuma[i]._d.getFullYear();
    result.push(dan + "." + mjesec + "." + godina);
  }
  startDate = result[0];
  endDate = result[result.length - 1];
  return result;
}

class ShopProduct extends React.Component {
  state = {
    value: undefined,
    treeData: [],
    products: [],
    allReceipts: [],
    prodaniProizvodi: new Map(),
    loading: false,
    loadMore: false,
    requestProducts: [],
  };

  potvrda = () => {
      let nizZahtjeva = [];
      if(mapaZahtjeva.size === 0) {
        message.error("Trying to send zero products!");
        return;
      }
      for (let [k, v] of mapaZahtjeva) 
        nizZahtjeva.push({"id": k, "quantity": v});
    
      Axios
      .post('https://main-server-si.herokuapp.com/api/merchant_dashboard/inventory_requests',
      {
        "officeId": IDposlovnice,
        "products": nizZahtjeva
      }, 
      { headers: { Authorization: 'Bearer ' + getToken()}}).then((response) => {
        if (response.data.statusCode !== 201) {
          message.error("Something went wrong!");
          return;
        }
        message.success("Your request was successfully sent")
      }).catch(error => {message.error('error');});
  }

  cancel = async () => {}

  UNSAFE_componentWillMount() {
    trenutnoOdabrano = '';
    this.fetchShops(async res => {
      this.setState({ treeData: [] });
      let noviNiz = [];
      for (let i = 0; i < res.length; i++) {
        let objekat = {};
        objekat.title = res[i].address + ' ' + res[i].city;
        objekat.value = 'p ' + res[i].id;
        IDposlovnice = res[i].id;
        let kase = await Axios
          .get(`https://main-server-si.herokuapp.com/api/business/offices/${res[i].id}/cashRegisters`, { headers: { Authorization: 'Bearer ' + getToken() } });
        let children = [];
        for (let j = 0; j < kase.data.length; j++) {
          children.push({ title: kase.data[j].name, value: kase.data[j].id });
        }
        objekat.children = children;
        noviNiz.push(objekat);

      }
      this.setState({ treeData: noviNiz });
      await this.fetchProducts();
      mapaZahtjeva = new Map();
    });
  }

  fetchShops = callback => {
    Axios
      .get('https://main-server-si.herokuapp.com/api/business/offices', { headers: { Authorization: 'Bearer ' + getToken() } })
      .then(response => {
        callback(response.data);
      })
      .catch(err => console.log(err));
  };

  fetchProducts = async () => {
    let proizvodi = await Axios
      .get(`https://main-server-si.herokuapp.com/api/offices/${IDposlovnice}/products`, { headers: { Authorization: 'Bearer ' + getToken() } });
    this.setState({ products: proizvodi.data });
  };

  fetchReceipts = async (from, to) => {
    this.setState({ allReceipts: [] });
    let racuni = await Axios.post(`https://main-server-si.herokuapp.com/api/receipts/filtered`, { from: from, to: to },
      { headers: { Authorization: 'Bearer ' + getToken() } });
    this.setState({ allReceipts: racuni.data });
  };

  onChangeDate = async values => {
    if (values == null) {
      startDate = '01.01.2000';
      endDate = datum;
      await this.fetchReceipts(startDate, endDate);
      this.onChange(trenutnoOdabrano);
      return;
    }
    nizDatumaLabel = rasponDatuma(values[0]._d, values[1]._d);
    await this.fetchReceipts(startDate, endDate);
    this.onChange(trenutnoOdabrano);
  }

  onChange = async value => {
    nizPrijeSearcha = null;
    requestNizPrijeSearcha = null;
    this.setState({ loading: true });
    trenutnoOdabrano = value;
    if (trenutnoOdabrano === '') {
      this.setState({ loading: false });
      message.warning('No shop or cash register has been selected!');
      return;
    }
    mapaProizvoda = new Map();
    keyMapa = [];
    let idKasa = [];
    let x = value[0];
    if (x === "p") {
      IDposlovnice = value.slice(2);
      this.fetchProducts();
      let kase = await Axios
        .get(`https://main-server-si.herokuapp.com/api/business/offices/${value.slice(2)}/cashRegisters`, { headers: { Authorization: 'Bearer ' + getToken() } });
      for (let j = 0; j < kase.data.length; j++)
        idKasa.push(kase.data[j].id);
    }
    else
      idKasa.push(value);
    for (let i = 0; i < this.state.allReceipts.length; i++) {
      if (idKasa.includes(this.state.allReceipts[i].cashRegisterId)) {
        let stavkeRacuna = this.state.allReceipts[i].receiptItems;
        for (let j = 0; j < stavkeRacuna.length; j++) {
          let info = {};
          let cijenaProizvoda = (100 - stavkeRacuna[j].discountPercentage) / 100 * stavkeRacuna[j].price;
          let brojProdanihProizvoda = stavkeRacuna[j].quantity; 
          info = { price: cijenaProizvoda * brojProdanihProizvoda, sold: brojProdanihProizvoda, unit: stavkeRacuna[j].unit, barcode: stavkeRacuna[j].barcode, slika: "" };
          if (!mapaProizvoda.has(stavkeRacuna[j].productName))
            mapaProizvoda.set(stavkeRacuna[j].productName, info);
          else {
            let oldInfoProdukt = {};
            oldInfoProdukt = mapaProizvoda.get(stavkeRacuna[j].productName);
            let ukupnaProdajnaCijena = oldInfoProdukt.price + cijenaProizvoda * brojProdanihProizvoda;
            let ukupnoProdanihProizvoda = oldInfoProdukt.sold + brojProdanihProizvoda;
            info = { price: ukupnaProdajnaCijena, sold: ukupnoProdanihProizvoda, unit: stavkeRacuna[j].unit, barcode: stavkeRacuna[j].barcode, slika: "" };
            mapaProizvoda.set(stavkeRacuna[j].productName, info);
          }
        }
      }
    }
    let sortedMap = new Map([...mapaProizvoda].sort((a, b) => {
      return a[0].localeCompare(b[0]);
    }));
    keyMapa = Array.from(sortedMap.keys());

    let sviProdani = [];
    for (let i = 0; i < keyMapa.length; i++) {
      let info = sortedMap.get(keyMapa[i]);
      info.name = keyMapa[i];
      for (let j = 0; j < this.state.products.length; j++) {
        if (this.state.products[j].product.name == info.name) {
          info.slika = this.state.products[j].product.image; 
          info.quantity = this.state.products[j].quantity;
          info.pdv = this.state.products[j].product.pdv;
          sviProdani.push(info);
          break;
        }
      }
    }
    this.setState({ prodaniProizvodi: sviProdani, value: value });
    if (sviProdani.length !== 0)
      this.setState({ loading: false });
    if (sviProdani.length === 0 && trenutnoOdabrano != '')
      this.setState({ loading: false });
  };

  onChangeQuantity = id => value => {
    if (value == null || value == '') return;
    mapaZahtjeva.set(id,value);
  }

  searchProducts(value) {
    if (value !== '') {
      if(nizPrijeSearcha == null)
        nizPrijeSearcha = this.state.prodaniProizvodi;
      let noviNiz = [];
      for (let i = 0; i < nizPrijeSearcha.length; i++) {
        if (nizPrijeSearcha[i].name.toLowerCase().includes(value.toLowerCase())) {
          noviNiz.push(nizPrijeSearcha[i]);
        }
      }
      this.setState({ prodaniProizvodi: noviNiz });
      return;
    }
    if (nizPrijeSearcha !== null)
      this.setState({ prodaniProizvodi: nizPrijeSearcha });
  }

  searchProductsRequest(value) {
    if (value !== '') {
      if(requestNizPrijeSearcha == null)
      requestNizPrijeSearcha = this.state.products;
      let noviNiz = [];
      for (let i = 0; i < requestNizPrijeSearcha.length; i++) {
        if (requestNizPrijeSearcha[i].product.name.toLowerCase().includes(value.toLowerCase())) {
          noviNiz.push(requestNizPrijeSearcha[i]);
        }
      }
      this.setState({ products: noviNiz });
      return;
    }
    if (requestNizPrijeSearcha !== null)
      this.setState({ products: requestNizPrijeSearcha });
  }

  newTabSelected = key => {
    currentTab = key;
  }

  handleInfiniteOnLoad = () => {
    
  }

  render() {
    return (
      <div>
        <div id="naslovStatistics">
        <h1>Products</h1>
      </div>
        <RangePicker style={{ margin: '10px' }}
            onChange={this.onChangeDate}
            name={['datum', 'range']}
            disabledDate={disabledDate}
            format={dateFormat}
            id='range'>
          </RangePicker>
        <div>
          <TreeSelect
            style={{ width: '20%' }}
            value={this.state.value}
            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
            treeData={this.state.treeData}
            placeholder="Select a shop or cash register"
            treeDefaultExpandAll
            onSelect={this.onChange}
          />
        </div>
        <br/>
        <div id="taboviZahtjeva">
        <div className="card-container">
          <Tabs type="card" onChange={this.newTabSelected}>
            <TabPane tab="Products" key="products">
            <div>
              <Search style={{ width: '280px' }} placeholder="Input product name" onSearch={value => this.searchProducts(value)} enterButton />
            </div>
            <div id="listaProizvoda">
            <List
              loading={this.state.loading}
              grid={{ column: 3, gutter: 16 }}
              dataSource={this.state.prodaniProizvodi}
              renderItem={item => (
                <List.Item>
                  <div style={{ width: "100%" }}>
                    <Card title={item.name} bordered={false}>
                      <div id="InfoProduktKartica">
                        <p><DollarOutlined /> Total traffic inc taxes: {(item.price*((100+item.pdv)/100)).toFixed(2)} KM</p>
                        <p><FieldNumberOutlined /> Total {item.unit} sold: {item.sold}</p>
                        <p><BarcodeOutlined /> Barcode: {item.barcode}</p>
                        <p><NumberOutlined/> Quantity in shop: {item.quantity}</p>
                        <p><NumberOutlined/> Tax for product: {item.pdv}%</p>
                      </div>
                      <div id="divSlike" >
                        <img id="slikaPr" src={item.slika}></img>
                      </div>
                    </Card>
                  </div>
                </List.Item>
              )}
            />
              </div>
            </TabPane>
            <TabPane tab="Request for products" key="requests">   
              <div>
                <Search style={{ width: '280px', margin: '0 auto', marginBottom: '10 px'}} placeholder="Input product name" onSearch={value => this.searchProductsRequest(value)} enterButton />
              </div>
              <br/>  
              <div>
              <Popconfirm
                title="Are you sure you want to send this request?" icon={<QuestionCircleOutlined style={{ color: 'blue' }}/>}
                onConfirm={this.potvrda}
                onCancel={this.cancel}
                okText="Yes"
                cancelText="No"
              >
                <Button type="primary">Send request</Button>
            </Popconfirm>
            </div>
              <div id = "ZahtjeviProizvod">
              <InfiniteScroll
                initialLoad={false}
                pageStart={0}
                loadMore={this.handleInfiniteOnLoad}
                hasMore={!this.state.loading && this.state.hasMore}
                useWindow={false}
            >
            <List id="listaProizvodaZahtjevi"
                itemLayout="horizontal"
                dataSource={this.state.products}
                renderItem={item => (
                <List.Item key={item.product.id}>
                  
                  <img id="slikaListaProizvodZahtjev" src={item.product.image}></img>
                    <List.Item.Meta 
                        title={item.product.name}
                        description={"Quantity: " + item.quantity}
                    />
                    <div id="divSpinnerQuantity">
                      <InputNumber min={0} max={20000} defaultValue={0} onChange={this.onChangeQuantity(item.product.id)} />
                    </div>
                </List.Item>
                )}
            >
            {this.state.loading && this.state.hasMore && (
              <div className="demo-loading-container">
                <Spin />
              </div>
            )}
            </List>
            </InfiniteScroll>
              </div>
            </TabPane>
            </Tabs>
            <br/>
            <br/>
            </div>
      </div>
      </div>
    );
  }
}


export default ShopProduct;