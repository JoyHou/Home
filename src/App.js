import React, {Component} from 'react';
import 'rc-steps/assets/index.css';
import 'rc-steps/assets/iconfont.css';
import './App.css';
import {emailValidation, phoneValidation} from "./js/validationCheck";
import Steps, {Step} from "rc-steps";

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            screenWidth: window.innerWidth,
            form: "personalInfo",
            dataCollection: {},
            addressValidation: null
        }
    }

    componentWillMount() {
        window.addEventListener('resize', this.dynamicScreenWidth);
        if (localStorage.getItem('expectedRent')) {
            this.setState({form: "finish"});
        } else if (localStorage.getItem('address')) {
            this.setState({form: "expectedRent", addressValidation: true})
        } else if (localStorage.getItem('fName')) {
            this.setState({form: "address"});
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.dynamicScreenWidth);
    }

    dynamicScreenWidth = () => {
        this.setState({screenWidth: window.innerWidth});
    };
    addressValidation = (text) => {
        console.log(text);
        if (window.google) {
            const service = new window.google.maps.places.AutocompleteService();
            const callBack = (prediction, status) => {
                if (status !== window.google.maps.places.PlacesServiceStatus.OK) {
                    this.setState({addressValidation: false});
                    document.getElementById("address-error").setAttribute("style", "display: true");
                } else {
                    let data = this.state.dataCollection;
                    data.address = text;
                    document.getElementById("address-error").setAttribute("style", "display: none");
                    localStorage.setItem('address', text);
                    this.requestZestimate(text);
                    this.setState({dataCollection: data});
                }
            };
            service.getQueryPredictions({input: text}, callBack);
        }
    };
    requiredInputHandler = (condition, errMsg) => {
        if (!condition) {
            document.getElementById(errMsg).setAttribute("style", "display: true");
        } else {
            document.getElementById(errMsg).setAttribute("style", "display: none");
        }
    };

    // doCORSRequest = (options, printResult) => {
    //     const cors_api_url = 'https://cors-anywhere.herokuapp.com/';
    //     const x = new XMLHttpRequest();
    //     x.open(options.method, cors_api_url + options.url);
    //     x.onload = x.onerror = function () {
    //         printResult(
    //             x.responseText || ''
    //         );
    //     };
    //     if (/^POST/i.test(options.method)) {
    //         x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    //     }
    //     x.send(options.data);
    // };

    requestZestimate = (text) => {
        console.log(text);
        const arr = text.split(", ");
        const adjustedArr = arr.map(x => x.replace(/ /g, "+"));
        const adjustedAddress = "address=" + adjustedArr[0] + "&citystatezip=" + adjustedArr[1] + "%2C+" + adjustedArr[2];
        // this.doCORSRequest({
        //     method: 'GET',
        //     url: "https://www.zillow.com/webservice/GetSearchResults.htm?zws-id=X1-ZWz1genmyxlkp7_3csw9&rentzestimate=true&" + adjustedAddress,
        // }, function printResult(text) {
        //     // const text = res.responseXML;
        //     const parseString = require('xml2js').parseString;
        //     parseString(text, (err, result) => {
        //         console.log(result);
        //         if (Number(result['SearchResults:searchresults'].message[0].code[0]) >= 500) {
        //             alert(result['SearchResults:searchresults'].message[0].text[0]);
        //         } else {
        //             const zestimate = result['SearchResults:searchresults'].response[0].results[0].result[0].rentzestimate[0].amount[0]._ ?
        //                 result['SearchResults:searchresults'].response[0].results[0].result[0].rentzestimate[0].amount[0]._ : Math.floor(Number(result['SearchResults:searchresults'].response[0].results[0].result[0].zestimate[0].amount[0]._) * 0.05 / 12);
        //             localStorage.setItem('zestimate', zestimate);
        //             let data = this.state.dataCollection;
        //             data.zestimate = zestimate;
        //             console.log(zestimate);
        //             this.setState({dataCollection: data, form: "expectedRent", addressValidation: true});
        //             console.log(this.state.dataCollection, this.state.form, this.state.addressValidation);
        //         }
        //     });
        // }.bind(this));
        fetch("https://cors-anywhere.herokuapp.com/" + "https://www.zillow.com/webservice/GetSearchResults.htm?zws-id=X1-ZWz1genmyxlkp7_3csw9&rentzestimate=true&"
        + adjustedAddress)
            .then(res => res.text())
            .then(text => {
                const parseString = require('xml2js').parseString;
                    parseString(text, (err, result) => {
                        console.log(result);
                        if (Number(result['SearchResults:searchresults'].message[0].code[0]) >= 500) {
                            alert(result['SearchResults:searchresults'].message[0].text[0]);
                            document.getElementById("loadingScreen").setAttribute("style", "display: none");
                        } else {
                            let zestimate;
                            if (result['SearchResults:searchresults'].response[0].results[0].result[0].rentzestimate[0].amount[0]._) {
                                zestimate = result['SearchResults:searchresults'].response[0].results[0].result[0].rentzestimate[0].valuationRange[0].low[0]._ + " - " +
                                    result['SearchResults:searchresults'].response[0].results[0].result[0].rentzestimate[0].valuationRange[0].high[0]._;
                            } else {
                                const temp = Math.floor(Number(result['SearchResults:searchresults'].response[0].results[0].result[0].zestimate[0].amount[0]._) * 0.05 / 12);
                                zestimate = temp * 0.95 + " - " + temp * 1.05;
                            }
                            localStorage.setItem('zestimate', zestimate);
                            let data = this.state.dataCollection;
                            data.zestimate = zestimate;
                            console.log(zestimate);
                            this.setState({dataCollection: data, form: "expectedRent", addressValidation: true});
                            console.log(this.state.dataCollection, this.state.form, this.state.addressValidation);
                        }
                    })
            })
            .catch(err => alert(err))

    };
    nextBtnHandler = () => {
        if (this.state.form === "personalInfo") {
            const emailHandler = emailValidation(this.state.dataCollection.email);
            const phoneHandler = phoneValidation(this.state.dataCollection.phone);
            this.requiredInputHandler(emailHandler, "email-error");
            this.requiredInputHandler(phoneHandler, "phone-error");
            const fName = document.getElementById('fName').value;
            const lName = document.getElementById('lName').value;
            this.requiredInputHandler(fName.length, 'fName-error');
            this.requiredInputHandler(lName.length, 'lName-error');
            if (emailHandler && phoneHandler && fName && lName) {
                if (fName.length > 0 && lName.length > 0) {
                    this.setState({form: "address"});
                    // localStorage.setItem('user_data', JSON.stringify(this.state.dataCollection));
                    localStorage.setItem('fName', fName);
                    localStorage.setItem('lName', lName);
                    localStorage.setItem('phone', this.state.dataCollection.phone);
                    localStorage.setItem('email', this.state.dataCollection.email);
                }
            }
        } else if (this.state.form === "address") {
            const fullAddress = document.getElementById("address").value;
            document.getElementById("loadingScreen") ? document.getElementById("loadingScreen").setAttribute("style", "display: true") : null;
            this.addressValidation(fullAddress);
        } else if (this.state.form === "expectedRent") {
            const rent = document.getElementById('expectedRent').value;
            this.requiredInputHandler(rent.length, 'rent-error');
            this.requiredInputHandler(Number(rent), 'rent-error');
            if (rent.length > 0 && Number(rent)) {
                console.log(this.state.dataCollection);
                if (!localStorage.getItem('zestimate')) {
                    localStorage.setItem('zestimate', this.state.dataCollection.zestimate);
                }
                localStorage.setItem('expectedRent', this.state.dataCollection.expectedRent);
                this.subscription();
                this.setState({form: "finish"});
            }
        }
    };

    subscription = () => {
        const headers = new Headers({
            'Authorization': 'Bearer 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',
            'Content-Type': 'application/json',
        });
        const parsedData = {
            "personalizations": [
                {
                    "to": [
                        {
                            "email": localStorage.getItem("email")
                        }
                    ],
                    "subject": "Sign Up Confirmation"
                }
            ],
            "from": {
                "email": "joyhou822@gmail.com"
            },
            "content": [
                {
                    "type": "text/html",
                    "value": "<p>Congratulations! You've signed up successfully! Below is the information you provided: </p>" +
                    "<br /><p><strong>First Name: </strong>" + localStorage.getItem('fName') + "</p><p><strong>LastName: </strong>" +
                    localStorage.getItem('lName') + "</p>" + "<p><strong>Email: </strong>" + localStorage.getItem('email') + "</p>" +
                    "<p><strong>Phone Number: </strong>" + localStorage.getItem('phone') + "</p><p>" +
                    "<strong>Address: </strong>" + localStorage.getItem('address') + "</p><p><strong>Zestimate: </strong>" + localStorage.getItem('zestimate')
                    + "</p><p><strong>Expected Rent: </strong>" + localStorage.getItem('expectedRent') + "</p>"
                }
            ]
        };

        fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            body: JSON.stringify(parsedData),
            headers: headers,
        }).then(res => res.text()).then(data => console.log(data))
    };
    goBackBtnHandler = () => {
        if (this.state.form === "address") {
            this.setState({form: "personalInfo", addressValidation: null})
        } else if (this.state.form === "expectedRent") {
            this.setState({form: "address", addressValidation: null})
        }
    };
    inputChangeHandler = (e) => {
        let data = this.state.dataCollection;
        data[e.target.id] = e.target.value;
        this.setState({dataCollection: data});
        if (this.state.form === "address") {
            this.autocomplete();
        }
    };
    autocomplete = () => {
        if (window.google) {
            const autocomplete = new window.google.maps.places.Autocomplete((document.getElementById('address')));
        }
    };

    render() {
        let loadingScreen = localStorage.getItem("address") ?
            <p style={{display: "none", width: "70%", margin: "auto"}} id="loadingScreen">Please wait while we getting your Zestimate Rent ...</p> : null;
        let mobile = this.state.screenWidth < 580;
        let form, instructionText;
        let step = 0;
        if (this.state.form === "personalInfo") {
            form =
                <div className="form-component">
                    <PersonalInfo inputHandler={this.inputChangeHandler}/>
                    <button onClick={() => this.nextBtnHandler()} className="nextBtn">Next</button>
                </div>;
            instructionText = "Let us know you";
        } else if (this.state.form === "address") {
            form =
                <div className="form-component">
                    <AddressInput inputHandler={this.inputChangeHandler}/>
                    <button onClick={() => this.nextBtnHandler()} className="nextBtn">Next</button>
                    <button onClick={() => this.goBackBtnHandler()} className="nextBtn">Go Back</button>
                    {loadingScreen}
                </div>;
            instructionText = "Where is your property?";
            step = 1;
        } else if (this.state.form === "expectedRent" && this.state.addressValidation && localStorage.getItem("zestimate")) {
            const zestimate = localStorage.getItem("zestimate");
            form =
                <div className="form-component">
                    <p>Zestimate Rent: </p>
                    <p>${zestimate}</p>
                    <RentInput inputHandler={this.inputChangeHandler}/>
                    <button onClick={() => this.nextBtnHandler()} className="nextBtn">Next</button>
                    <button onClick={() => this.goBackBtnHandler()} className="nextBtn">Go Back</button>
                </div>;
            instructionText = "This is your estimated rent. Please provide your expected" +
                " rent which might be different from the estimation";
            step = 2;
        } else if (this.state.form === "finish") {
            form = <div className="form-component">
                {/*TODO: check mark image*/}
                <h1>Finished!</h1>
            </div>;
            instructionText = "We will send you a confirmation email shortly";
            step = 3;
        }

        let progressBar = <Steps direction="vertical" current={step} className="progressbar-component">
            <Step title="personal Information"/>
            <Step title="Address"/>
            <Step title="Rent"/>
            <Step title="Finish"/>
        </Steps>;
        let progressBar_mobile =
            <div className="progressbar-component-mobile">
                <Steps current={step} labelPlacement="vertical" size="small" style={{marginLeft: "-20px"}}>
                    <Step title="Personal Info"/>
                    <Step title="Address"/>
                    <Step title="Rent"/>
                    <Step title="Finish"/>
                </Steps></div>;

        if (!mobile) {
            return (
                <div className="App">
                    <Instruction text={instructionText}/>
                    <History step={this.state.form}/>
                    {form}
                    {progressBar}
                    <button onClick={() => localStorage.clear()} className="nextBtn">Clear data</button>
                </div>
            );
        } else {
            return (
                <div className="App-mobile">
                    {progressBar_mobile}
                    {form}
                    <History step={this.state.form}/>
                    <Instruction text={instructionText}/>
                    <button onClick={() => localStorage.clear()} className="nextBtn">Clear data</button>
                </div>
            )
        }


    }
}

class PersonalInfo extends Component {
    render() {
        return (
            <div>
                <input placeholder="First Name" id="fName" className="input-group"
                       onChange={(e) => this.props.inputHandler(e)}/>
                <p className="error" id="fName-error" style={{display: "none"}}>First Name cannot be empty</p>

                <input placeholder="Last Name" id="lName" className="input-group"
                       onChange={(e) => this.props.inputHandler(e)}/>
                <p className="error" id="lName-error" style={{display: "none"}}>Last Name cannot be empty</p>

                <input placeholder="Email" id="email" className="input-group"
                       onChange={(e) => this.props.inputHandler(e)}/>
                <p className="error" id="email-error" style={{display: "none"}}>Please check your email address</p>
                <input placeholder="Phone Number" id="phone" className="input-group"
                       onChange={(e) => this.props.inputHandler(e)}/>
                <p className="error" id="phone-error" style={{display: "none"}}>Please check your phone number</p>

            </div>
        )
    }
}

class AddressInput extends Component {
    render() {
        return (
            <div>
                <input placeholder="Address" id="address" className="input-group"
                       onChange={(e) => this.props.inputHandler(e)}/>
                <p className="error" id="address-error" style={{display: "none"}}>The address is invalid, please check
                    again</p>
            </div>
        )
    }
}

class RentInput extends Component {
    render() {
        return (
            <div>
                <input placeholder="Expected Rent" id="expectedRent" className="input-group"
                       onChange={(e) => this.props.inputHandler(e)}/>
                <p className="error" id="rent-error" style={{display: "none"}}>Expected rent cannot be empty</p>

            </div>
        )
    }
}

class Instruction extends Component {
    render() {
        return (
            <div id="instruction_component">
                <p id="instruction_text">{this.props.text}</p>
            </div>
        )
    }
}

class History extends Component {
    render() {
        // const data = JSON.parse(localStorage.getItem('user_data'));
        // if (data) {
        return (
            <div className="history-component">
                <h2>History</h2>
                <table>
                    {localStorage.getItem('fName') ? <tr>
                        <th className="history-title">First Name</th>
                        <td className="history-content">{localStorage.getItem('fName')}</td>
                    </tr> : null}
                    {localStorage.getItem('lName') ? <tr>
                        <th className="history-title">Last Name</th>
                        <td className="history-content">{localStorage.getItem('lName')}</td>
                    </tr> : null}
                    {localStorage.getItem('email') ? <tr>
                        <th className="history-title">Email</th>
                        <td className="history-content">{localStorage.getItem('email')}</td>
                    </tr> : null}
                    {localStorage.getItem('phone') ? <tr>
                        <th className="history-title">Phone Number</th>
                        <td className="history-content">{localStorage.getItem('phone')}</td>
                    </tr> : null}
                    {localStorage.getItem('address') ? <tr>
                        <th className="history-title">address</th>
                        <td className="history-content">{localStorage.getItem('address')}</td>
                    </tr> : null}
                    {localStorage.getItem('zestimate') ? <tr>
                        <th className="history-title">Zestimate Rent</th>
                        <td className="history-content">{localStorage.getItem('zestimate')}</td>
                    </tr> : null}
                    {localStorage.getItem('expectedRent') ? <tr>
                        <th className="history-title">Expected Rent</th>
                        <td className="history-content">{localStorage.getItem('expectedRent')}</td>
                    </tr> : null}
                </table>
            </div>
        )
        // } else {
        //     return (
        //     <div className="history-component" >
        //         <h2>History</h2>
        //     </div>)
        // }

    }
}

export default App;
