import React from "react";
import { StyleSheet, View, Text, SafeAreaView, FlatList, ActivityIndicator, Image,TouchableOpacity,Platform, Linking } from 'react-native';
import commonStyles from '../styles/Common';
import { CheckBox, Textarea, Toast } from 'native-base';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { ScrollView } from "react-native-gesture-handler";
import Header from '../core/components/Header';
import { withNavigation, StackActions, NavigationActions } from 'react-navigation';
import Globals from '../Globals';
import AsyncStorage from '@react-native-community/async-storage';
import LoadingIndicator from '../core/components/LoadingIndicator';
import { connect } from "react-redux";
import StyleConstants from '../styles/StyleConstants'
import NetInfo from "@react-native-community/netinfo";

class ShiftChanged extends React.Component {
    state = {
        expanded: true,
        loading: true,
        data: '',
        Currpay: false
    }

    async componentWillMount() {
        var data={}
        data.agency_logo = await AsyncStorage.getItem('agency_logo');
        data.agency_name = await AsyncStorage.getItem('agency_name');
        this.setState({agency_details:data})
        var Payroll_data = ''
        Payroll_data = this.props.navigation.state.params.item
        this.setState({ loading: true, data: Payroll_data }, () => {
            console.log('prop:', this.props.navigation.state.params.item)
            this.setState({ loading: false })
        })
    }

    showMessage(message) {
        Toast.show({
            text: message,
            duration: 2000
        })
    }

    navigateToDashboard() {
        const resetAction = StackActions.reset({
            index: 0,
            actions: [
                NavigationActions.navigate({
                    routeName: "TabManager"
                })
            ]
        });
        this.props.navigation.dispatch(resetAction);
    }

    checkInternet() {
        return new Promise((resolve, reject) => {
            NetInfo.fetch().then(state => {
                if (state.isConnected) {
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            });
        })

    }

    async Apply() {
        var id = this.state.data.assigned_shift[_.keys(this.state.data.assigned_shift)[0]];
        this.state.page_no = this.state.page_no + 1;
        const axios = require('axios');
        var agency_code = await AsyncStorage.getItem('agency_code');
        var url = Globals.httpMode + agency_code + Globals.domain + '/api/v1/shifts/'+ id.id+'/act';
        console.log("url : ", url);
        try {
            var access_token = this.props.data.access_token;
            console.log("acc : ", access_token);
            const headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'App-Token': '96ef950f-bfae-4ee5-89a0-f23ab9e50b96',
                'Authentication-Token': access_token
            }
            var requestBody = qs.stringify({
                'shift_action': 'caregiver acknowledge'
            });
            console.log("token : ", access_token);
            try {
                var response = await axios.put(url, requestBody, {
                    headers: headers
                })
                if(response){
                    console.log("data : ", response.data)
                    if(response.data.message=='Update successfully'){
                        this.updatedata()
                    }
                    // this.showMessage(response.data.message);
                    // this.props.navigation.goBack()
                }
                 
            }
            catch (error) {
                this.showMessage(error);

                console.log("error : ", error);
            }
        }
        catch (e) {
            var error = (_.get(e, 'response.status', null) ? _.get(e, 'response.data.errors', 'Something went wrong!') : 'Network error!');
            this.setState({
                loading: false,
            })
            this.showMessage(error);
        }
    }

    async updatedata(){
        var id = this.state.data
        var request = require('superagent');
        var access_token = this.props.data.access_token;
        var agency_code = await AsyncStorage.getItem('agency_code');
        var url = Globals.httpMode + agency_code + Globals.domain + '/api/v1/notices/'+id.id;
        console.log(url)
        return new Promise((resolve, reject) => {
            request
                .put(url)
                .set('Content-Type', 'application/json')
                .set('App-Token','96ef950f-bfae-4ee5-89a0-f23ab9e50b96')
                .set('Authentication-Token',access_token)
                .end((err, res) => {
                    if(err){
                        return reject(err);
                    }
                    console.log('resolve:',res)
                    this.showMessage(res.body.message);
                    this.setState({ loading: true, page_no: 0 }, () => {
                    this.props.navigation.goBack()
                    })
                })
        });
    }

    render() {
        const { navigate } = this.props.navigation;
        var userData = null;
        var session = null;
        var userData_id =null;
        var caregiver = null;
        if (this.state.loading) {
            return (
                <SafeAreaView style={[commonStyles.full, commonStyles.backgroundColor,]}>
                    <Header onLogo={() => { this.navigateToDashboard() }} label={"Shift Changed"} expanded={true} onBack={() => {
                        this.props.navigation.goBack()
                    }} />
                     <LoadingIndicator />
                </SafeAreaView>
            )
        }
        else {
            userData_id = this.state.data.assigned_shift[_.keys(this.state.data.assigned_shift)[0]];
            userData = userData_id.client[_.keys(userData_id.client)[0]];
            var name = userData.name
            var words = name.split(' ');
            console.log("care_log:", userData)
            var cg_name = this.state.data.name !=null ?this.state.data.name:null
            var cg_words = cg_name.split(' ');

            return (
                <SafeAreaView style={[commonStyles.full, commonStyles.backgroundColor]}>
                    <Header onLogo={() => { this.navigateToDashboard() }} Agency_logo={this.state.agency_details} label={this.state.data.notice_type=='You Received A New Shift'?'New Shift':this.state.data.notice_type} expanded={this.state.expanded} onBack={() => { this.props.navigation.goBack() }} />
                    <ScrollView showsVerticalScrollIndicator={false}>

                        <View style={[commonStyles.margin, commonStyles.column, commonStyles.full]}>

                            <View style={{ margin: wp('1%') }}>
                                <Text style={{ marginTop: -2, fontSize: hp('2%'), color: '#828EA5', fontFamily: 'Catamaran-Bold', justifyContent: 'center' }}>{this.state.data.title}</Text>
                            </View>

                            <View style={[styles.itemRectangleShape, commonStyles.column, { padding: wp('3%'), flexDirection: 'column', flex:1 }]}>
                                <View style={{justifyContent:'space-between', flexDirection:'row'}}>
                                <View style={{ flexDirection: 'row', marginVertical: wp('2%') }}>
                                    <View style={{ justifyContent: 'flex-start', alignItems: 'flex-start', width: wp('11.5%') }}>
                                        {
                                            userData.avatar_url!=null ? <View>
                                                <Image style={[styles.clientImage]}
                                                    resizeMode={"cover"}
                                                    resizeMethod={"resize"} // <-------  this helped a lot as OP said
                                                    // progressiveRenderingEnabled={true}
                                                    source={{ uri: userData.avatar_url }} />
                                            </View> :
                                                <View style={[commonStyles.center, { width: wp('8%'), height: hp('4%'), backgroundColor: '#fff', borderColor: 'black', borderWidth: wp('0.1%'), borderRadius: 18 }]}>
                                                    <Image style={[styles.clientImage]}
                                                        resizeMode={"cover"}
                                                        resizeMethod={"resize"} // <-------  this helped a lot as OP said
                                                        // progressiveRenderingEnabled={true}
                                                        source={require('../../assets/images/avatar.png')} />
                                                </View>
                                        }
                                    </View>
                                    <View style={{ margin: wp('0.5%'),flexDirection:'column' }}>
                                        <Text style={{ marginTop: -2, fontSize: hp('2.3%'), color: '#828EA5', fontFamily: 'Catamaran-Bold', justifyContent: 'center' }}>{words[0].charAt(0).toUpperCase() + words[0].slice(1)+' '+ words[1].slice(0,1).toUpperCase()|| '---'}</Text>
                                        <View style={[commonStyles.row, commonStyles.center, commonStyles.full, { justifyContent: 'flex-start', marginTop:wp('2%') }]}>
                                            <Image style={[styles.smallImage]}
                                                source={require('../../assets/images/clock.png')} />
                                            <Text style={{ marginTop: -2,marginLeft:wp('2%'), fontSize: hp('2%'), color: '#828EA5', fontFamily: 'Catamaran-Regular', justifyContent: 'flex-end' }}>{userData_id.start_time != null ? moment(userData_id.start_time).format('hh:mm a') + ' - ' + moment(userData_id.end_time).format('hh:mm a') : '---'}</Text>
                                        </View>
                                        <View style={[commonStyles.row, commonStyles.center, commonStyles.full, { justifyContent: 'flex-start' }]}>
                                            <Image style={[styles.smallImage]}
                                                source={require('../../assets/images/calendar.png')} />
                                            <Text style={{ marginTop: -2,marginLeft:wp('2%'), fontSize: hp('2%'), color: '#828EA5', fontFamily: 'Catamaran-Regular', justifyContent: 'flex-end' }}>{userData_id.start_time!=null ? moment(userData_id.start_time).format('MMM DD, YYYY') : '---'}</Text>
                                        </View>
                                        <View style={[commonStyles.row, commonStyles.center, commonStyles.full, { justifyContent: 'flex-start',alignItems:'flex-start', }]}>
                                            <Image style={[styles.smallImage,{marginTop:hp('1%')}]}
                                                source={require('../../assets/images/location.png')} />
                                            <TouchableOpacity style={{width:wp('40%')}} 
                                            onPress={async () => {
                                                if (await this.checkInternet()) {
                                                const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
                                                const latLng = `${userData_id.latitude},${userData_id.longitude}`;
                                                const label = 'Custom Label';
                                                const url = Platform.select({
                                                    ios: `${scheme}${userData_id.location}`,
                                                    android: `${scheme}${userData_id.location}`
                                                });
                                                Linking.openURL(url);
                                            }else{
                                                this.showMessage("No Internet Connectivity!")
                                            }
                                            }}>
                                                <Text style={{ flex:1,marginTop: -2,marginLeft:wp('2%'), fontSize: hp('2%'), color: '#41A2EB', textDecorationLine: 'underline', fontFamily: 'Catamaran-Regular', justifyContent: 'flex-end' }}>{userData_id.location != null ? userData_id.location : '---'}</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View style={[commonStyles.row, commonStyles.center, commonStyles.full, { justifyContent: 'flex-start' }]}>
                                            <Image style={[styles.smallImage]}
                                                source={require('../../assets/images/distance.png')} />
                                        <Text style={{ marginTop: -2,marginLeft:wp('2%'), fontSize: hp('2%'), color: '#828EA5', fontFamily: 'Catamaran-Regular', justifyContent: 'flex-end' }}>Distance: {userData_id.reimbursement_mileage !=null ?userData_id.reimbursement_mileage.miles + ' miles' : '---'}</Text>
                                        </View>
                                        <View style={[commonStyles.row, commonStyles.center, commonStyles.full, { justifyContent: 'flex-start' }]}>
                                            <Image style={[styles.smallImage]}
                                                source={require('../../assets/images/pay-rate.png')} />
                                        <Text style={{ marginTop: -2 ,marginLeft:wp('2%'), fontSize: hp('2%'), color: '#828EA5', fontFamily: 'Catamaran-Regular', justifyContent: 'flex-end' }}>Pay Rate: {userData_id.rate !=null ?'$'+userData_id.rate + '/hr' : '---'}</Text>
                                        </View>
                                    </View>
                                </View>
                                {/* <View style={{ justifyContent: 'flex-start', alignItems: 'center',flexDirection: 'column', marginVertical: wp('2%')}}> */}
                                    {/* <View style={{ justifyContent: 'center', alignItems: 'center', width: wp('11.5%')}}>
                                        {
                                            this.state.data.notice_type=='You Received A New Shift'?null:
                                            this.state.data.avatar_url!=null ? <View>
                                                <Image style={[styles.clientImage]}
                                                    resizeMode={"cover"}
                                                    resizeMethod={"resize"} // <-------  this helped a lot as OP said
                                                    // progressiveRenderingEnabled={true}
                                                    source={{ uri: this.state.data.avatar_url }} />
                                            </View> :
                                                <View style={[commonStyles.center, { width: wp('8%'), height: hp('4%'), backgroundColor: '#fff', borderColor: 'black', borderWidth: wp('0.1%'), borderRadius: 18 }]}>
                                                    <Image style={[styles.clientImage]}
                                                        resizeMode={"cover"}
                                                        resizeMethod={"resize"} // <-------  this helped a lot as OP said
                                                        // progressiveRenderingEnabled={true}
                                                        source={require('../../assets/images/avatar.png')} />
                                                </View>
                                        }
                                    </View>
                                    {this.state.data.notice_type=='You Received A New Shift'?null:<Text style={{ marginTop: -2, fontSize: hp('2%'), color: '#828EA5', fontFamily: 'Catamaran-Regular', justifyContent: 'flex-end' }}>{words[0].charAt(0).toUpperCase() + words[0].slice(1)+' '+ words[1].slice(0,1).toUpperCase()|| '---'}</Text>} */}
                                {/* </View> */}
                                </View>
                                <View style={styles.line} />
                                <View style={{ flex: 1,}}>
                                    <View style={{ flex: 4, margin: wp('1%'), justifyContent: 'flex-start', alignItems: 'flex-start', flexDirection:'row' }}>
                                        <Text style={{ marginTop: -2, fontSize: hp('2%'), color: '#828EA5', fontFamily: 'Catamaran-Bold', justifyContent: 'flex-start' }}>Care Matching</Text>
                                        <Text style={{ marginTop: -2, fontSize: hp('2%'), color: '#828EA5', fontFamily: 'Catamaran-Bold', justifyContent: 'flex-start' }}>  ({Object.keys(userData.care_matching).length})</Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row' }}>
                                    <View style={{flexDirection:'column',marginLeft:wp('2%')}}>                                   
                                        {Object.keys(userData.care_matching).length > 0 ?
                                        Object.keys(userData.care_matching).map((key) => (
                                            <View style={[commonStyles.full]}>
                                                <View style={[commonStyles.row, { alignItems: 'center' }]}>
                                                    <Image style={styles.greenCheckImage}
                                                        source={require('../../assets/images/green-check.png')} />
                                                    <Text style={{ fontFamily: 'Catamaran-Regular', color: '#293D68', fontSize: hp('1.8%'), marginLeft: wp('2%') }}>{userData.care_matching[key]}</Text>
                                                </View>
                                            </View>
                                        )) :
                                        <View style={[commonStyles.full]}>
                                            <View style={[commonStyles.row, { alignItems: 'center' }]}>
                                                <Text style={{ fontFamily: 'Catamaran-Regular', color: '#828EA5', fontSize: hp('1.8%'), marginLeft: wp('2%') }}>No Data</Text>
                                            </View>
                                        </View>
                                    }
                                    </View>
                                </View>
                                <View style={styles.line} />
                                <View style={{ flex: 1,}}>
                                    <View style={{ flex: 4, margin: wp('1%'), justifyContent: 'flex-start', alignItems: 'flex-start', flexDirection:'row' }}>
                                        <Text style={{ marginTop: -2, fontSize: hp('2%'), color: '#828EA5', fontFamily: 'Catamaran-Bold', justifyContent: 'flex-start' }}>Interest Matching</Text>
                                        <Text style={{ marginTop: -2, fontSize: hp('2%'), color: '#828EA5', fontFamily: 'Catamaran-Bold', justifyContent: 'flex-start' }}>  ({Object.keys(userData.interest_matching).length})</Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row' }}>
                                    <View style={{flexDirection:'column',marginLeft:wp('2%')}}>                                   
                                        {Object.keys(userData.interest_matching).length > 0 ?
                                        Object.keys(userData.interest_matching).map((key) => (
                                            <View style={[commonStyles.full]}>
                                                <View style={[commonStyles.row, { alignItems: 'center' }]}>
                                                    <Image style={styles.greenCheckImage}
                                                        source={require('../../assets/images/green-check.png')} />
                                                    <Text style={{ fontFamily: 'Catamaran-Regular', color: '#293D68', fontSize: hp('1.8%'), marginLeft: wp('2%') }}>{userData.interest_matching[key]}</Text>
                                                </View>
                                            </View>
                                        )) :
                                        <View style={[commonStyles.full]}>
                                            <View style={[commonStyles.row, { alignItems: 'center' }]}>
                                                <Text style={{ fontFamily: 'Catamaran-Regular', color: '#828EA5', fontSize: hp('1.8%'), marginLeft: wp('2%') }}>No Data</Text>
                                            </View>
                                        </View>
                                    }
                                    </View>
                                </View>
                                <View style={styles.line} />
                                <View style={{ flex: 1,}}>
                                    <View style={{ flex: 4, margin: wp('1%'), justifyContent: 'flex-start', alignItems: 'flex-start', flexDirection:'row' }}>
                                        <Text style={{ marginTop: -2, fontSize: hp('2%'), color: '#828EA5', fontFamily: 'Catamaran-Bold', justifyContent: 'flex-start' }}>Tasks</Text>
                                        <Text style={{ marginTop: -2, fontSize: hp('2%'), color: '#828EA5', fontFamily: 'Catamaran-Bold', justifyContent: 'flex-start' }}>  ({Object.keys(userData_id.care_log).length})</Text>
                                    </View>
                                </View>
                                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', marginBottom: wp('3%') }}>
                                    <View style={[commonStyles.full]}>
                                        <View style={[commonStyles.coloumn, commonStyles.full]}>
                                            {
                                                userData_id.care_log ?
                                                    Object.keys(userData_id.care_log).map((key) => (
                                                        <View style={[commonStyles.row, { alignItems: 'center' }]}>
                                                            <Image style={styles.greenCheckImage}
                                                                source={require('../../assets/images/green-check.png')} />
                                                            <Text style={{ fontFamily: 'Catamaran-Regular', color: '#828EA5', fontSize: hp('1.8%'), marginLeft: wp('2%') }}>{userData_id.care_log[key].title}</Text>
                                                        </View>
                                                    )) : <View style={[commonStyles.full]}>
                                                    <View style={[commonStyles.row, { alignItems: 'center' }]}>
                                                        <Text style={{ fontFamily: 'Catamaran-Regular', color: '#828EA5', fontSize: hp('1.8%'), marginLeft: wp('2%') }}>No Data</Text>
                                                    </View>
                                                </View>
                                            }
                                        </View>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row' }}>
                                    <View style={{flexDirection:'column',marginLeft:wp('2%')}}> 
                                    </View>
                                </View>
                                {/* <View style={styles.line} /> */}
                                <View style={{ flexDirection: 'row',justifyContent:'center', flex:1,padding:wp('4%'),paddingLeft:wp('8%'),paddingRight:wp('8%'),alignItems:'center' }}>
                                    <TouchableOpacity 
                                    onPress={async () => {
                                        //console.log("internet : ", await this.checkInternet());
                                        if (await this.checkInternet()) {
                                            this.Apply()
                                        }else{
                                            this.showMessage("No Internet Connectivity!")
                                        }}}
                                    style={{ flex: 0.5, backgroundColor:'#2777C8', borderRadius:5,margin:wp('2%'),padding:wp('2%'),justifyContent:'center',alignItems:'center'}}>
                                        <Text style={{ marginTop: -2, fontSize: hp('2%'), color: '#ffffff', fontFamily: 'Catamaran-Medium', justifyContent: 'center',alignSelf:'center' }}>Acknowledge</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={{ flexDirection: 'row', }}>
                                    <View style={{ flex: 3 }}>
                                        {/* <Text style={{ marginTop: -2, fontSize: hp('2%'), color: '#828EA5', fontFamily: 'Catamaran-Regular', justifyContent: 'center' }}>Extra Expenses:</Text> */}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        {/* <Text style={{ marginTop: -2, fontSize: hp('2%'), color: '#828EA5', fontFamily: 'Catamaran-Regular', justifyContent: 'center' }}>{userData.overtime_hours  }</Text> */}
                                    </View>
                                    <View style={{ flex: 0.5 }}>
                                        {/* <Text style={{ marginTop: -2, fontSize: hp('2%'), color: '#828EA5', fontFamily: 'Catamaran-Regular', justifyContent: 'center' }}>$ {userData.overtime_rate.toFixed(2)}</Text> */}
                                    </View>
                                    <View style={{ flex: 1.5,justifyContent:'flex-end',alignItems:'flex-end' }}>
                                        {/* <Text style={{ marginTop: -2, fontSize: hp('2%'), color: '#828EA5', fontFamily: 'Catamaran-Regular', justifyContent: 'flex-end' }}>$ {userData.extra_expenses.toFixed(2)  || '---'}</Text> */}
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', }}>
                                    <View style={{ flex: 3 }}>
                                        {/* <Text style={{ marginTop: -2, fontSize: hp('2%'), color: '#828EA5', fontFamily: 'Catamaran-Regular', justifyContent: 'center' }}>Reimbursement Mileage:</Text> */}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        {/* <Text style={{ marginTop: -2, fontSize: hp('2%'), color: '#828EA5', fontFamily: 'Catamaran-Regular', justifyContent: 'center' }}>$ {userData.overtime_rate.toFixed(2)}</Text> */}
                                    </View>
                                    <View style={{ flex: 1,justifyContent:'flex-end',alignItems:'flex-end' }}>
                                        {/* <Text style={{ marginTop: -2, fontSize: hp('2%'), color: '#828EA5', fontFamily: 'Catamaran-Regular', justifyContent: 'flex-end' }}>$ {userData.reimbursement_amount.toFixed(2) || '---'}</Text> */}
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row' }}>
                                    <View style={{ flex: 3 }}>
                                        {/* <Text style={{ marginTop: -2, fontSize: hp('2%'), color: '#828EA5', fontFamily: 'Catamaran-Regular', justifyContent: 'center' }}>Total:</Text> */}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        {/* <Text style={{ marginTop: -2, fontSize: hp('2%'), color: '#828EA5', fontFamily: 'Catamaran-Regular', justifyContent: 'center' }}>{userData.regular_hours}</Text> */}
                                    </View>
                                    <View style={{ flex: 0.5 }}>
                                        {/* <Text style={{ marginTop: -2, fontSize: hp('2%'), color: '#828EA5', fontFamily: 'Catamaran-Regular', justifyContent: 'center' }}>$ {userData.regular_rate.toFixed(2)  || '---'}</Text> */}
                                    </View>
                                    <View style={{ flex: 1.5,justifyContent:'flex-end',alignItems:'flex-end' }}>
                                        {/* <Text style={{ marginTop: -2, fontSize: hp('2%'), color: '#828EA5', fontFamily: 'Catamaran-Regular', justifyContent: 'flex-end'  }}>$ {userData.total_amount.toFixed(2)  || '---'}</Text> */}
                                    </View>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            );
        }
    }
}

const styles = StyleSheet.create({
    itemRectangleShape: {
        marginTop: wp('3%'),
        borderWidth: 0.01,
        borderBottomLeftRadius: 5,
        borderBottomRightRadius: 5,
        borderTopRightRadius: 5,
        borderTopLeftRadius: 5,
        backgroundColor: '#fff',
        borderColor: '#fff'
    },
    itemHeader: {
        fontFamily: 'Catamaran-Medium',
        color: '#293D68',
        fontSize: hp('2.2%')
    },
    itemValue: {
        fontFamily: 'Catamaran-Bold',
        color: '#828EA6',
        fontSize: hp('2.2%')
    },
    clientImage: {
        width: wp('8%'), height: hp('4%'),
        aspectRatio: 1,
        borderColor: '#fff',
        backgroundColor: '#CFCFCF',
        borderBottomLeftRadius: 14,
        borderBottomRightRadius: 14,
        borderTopRightRadius: 14,
        borderTopLeftRadius: 14,
    }, 
    line: {
        marginTop: wp('2%'),
        borderWidth: 0.25,
        borderColor: '#828EA5',
    },
    greenCheckImage: {
        width: wp('3.2%'),
        height: hp('3.3%'),
        resizeMode: 'contain'
    },
    smallImage: {
        width: wp('3%'),
        height: hp('3%'),
        aspectRatio: 1,
        resizeMode: 'contain'
    },

});
const mapStateToProps = state => ({
    data: state.user.data
});

export default connect(
    mapStateToProps,
    null
)(withNavigation(ShiftChanged));