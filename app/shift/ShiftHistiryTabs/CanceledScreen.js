import React from "react";
import { StyleSheet, View, Image, SafeAreaView, Text, FlatList, Linking, TextInput, Platform } from 'react-native';
import commonStyles from '../../styles/Common';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { ScrollView } from "react-native-gesture-handler";
import { withNavigation, StackActions, NavigationActions } from 'react-navigation';
import Globals from '../../Globals';
import AsyncStorage from '@react-native-community/async-storage';
import LoadingIndicator from '../../core/components/LoadingIndicator';
import { connect } from "react-redux";
import StyleConstants from '../../styles/StyleConstants'
import { Toast } from 'native-base'
import NetInfo from "@react-native-community/netinfo";


export default class CanceledScreen extends React.Component {

    state = {
        loading: true,
        data: [],
        per_page: 10,
        page_no: 0,
        search_page: 0
    }

    componentWillMount() {
        this.setState({ loading: true }, async() => {
            if (await this.checkInternet()) {
            this.getCurrentData();
            }
            else{
                this.showToast("No Internet Connectivity!")

            }
        })
    }


checkInternet() {
    return new Promise((resolve, reject) => {
    NetInfo.fetch().then(state => {
    //console.log("Connection type", state.type);
    if (state.isConnected) {    
    resolve(true);
    }
    else {
    resolve(false);
    }
    });
    })
    
    }



    showMessage(message) {
        Toast.show({
            text: message,
            duration: 2000
        })
    }

    async getCurrentData() {
        this.state.page_no = this.state.page_no + 1;
        const axios = require('axios');
        var agency_code = await AsyncStorage.getItem('agency_code');

        var url = Globals.httpMode + agency_code  + Globals.domain + '/api/v1/shifts?page=' + this.state.page_no + '&per_page=' + this.state.per_page + '&include_status[]=canceled by client';
        console.log("url : ", url);

        try {

            //var response = await this.props.data.formRequest.get(url);
            var access_token = this.props.data.access_token;
            console.log("acc : ", access_token);
            const headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'App-Token': '96ef950f-bfae-4ee5-89a0-f23ab9e50b96',
                'Authentication-Token': access_token
            }
            try {
                var response = await axios.get(url, {
                    headers: headers
                })
                if (response.status === 200) {
                    console.log("data : ", response.data)
                    if (response.data !== null) {
                        this.setState({

                            data: response.data.shifts, loading: false
                        })
                    }
                    else {
                        this.state.page_no = this.state.page_no - 1;
                    this.showToast("No data here!");
                    this.setState({
                        loading: false,
                    })

                    }
                }
                else {
                    this.showToast("No data here!");
                    this.setState({
                        loading: false,
                    })
                }
            }
            catch (error) {
                this.showToast("No data here!");
                console.log("error : ", error);
            }
        }
        catch (e) {
            var error = (_.get(e, 'response.status', null) ? _.get(e, 'response.data.errors', 'No data here!') : 'No data here!');
            this.setState({
                loading: false,
            })
            this.showMessage(error);
        }
    }
    async SearchFilterFunction(text) {
        this.setState({ search_page: 1, searchInput: text })
        console.log('length:', text.length);
        if (text.length > 2) {
            this.setState({ data: '' })

            const axios = require('axios');
            var agency_code = await AsyncStorage.getItem('agency_code');

            var start = new Date();
            // console.log('start:',start);

            var nextsevenDay = new Date(start);
            nextsevenDay.setDate(start.getDate() + 6);
            // console.log(nextsevenDay); // May 01 2000    
            while (start <= nextsevenDay) {
                this.state.dateArray.push(moment(start).format())
                start = moment(start).add(1, 'days');
            }

            var millisecondsMonday = moment(start).format('X');
            var millisecondsSunday = moment(nextsevenDay).format('X');
            // console.log("dateArray:",millisecondsMonday,"mill:",millisecondsSunday); 
            var url = Globals.httpMode + agency_code  + Globals.domain + '/api/v1/shifts?page=' + this.state.search_page + '&per_page=' + this.state.per_page + '&name=' + text + '&include_status[]=canceled by client';
            console.log("url : ", url);

            try {

                //var response = await this.props.data.formRequest.get(url);
                var access_token = this.props.data.access_token;
                // console.log("acc : ", access_token);
                const headers = {
                    'Accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'App-Token': '96ef950f-bfae-4ee5-89a0-f23ab9e50b96',
                    'Authentication-Token': access_token
                }
                try {
                    var response = await axios.get(url, {
                        headers: headers
                    })

                    if (response.status === 200) {
                        // console.log("data : ", response.data.shifts)
                        if (response.data !== null) {
                            // console.log("data : ", response.data)
                            var responseData = _.map(_.get(response, 'data.shifts', []), (item) => {
                                return {
                                    ...item,
                                    mode: 'Collapsed'
                                }
                            })
                            console.log('item:', responseData)
                            this.setState({
                                data: responseData, loading: false
                            }, () => {
                                console.log('data', this.state.data)
                            })
                        }
                        else {
                            // this.state.search_page = this.state.search_page - 1;
                            this.setState({ search_page: this.state.search_page - 1 })
                        }
                    }
                    else {
                        this.showToast("Invalid Credentials");
                    }
                }
                catch (error) {
                    // console.log("error : ", error);
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
        else {
            this.setState({ page_no: 0 }, () => {
                this.getCurrentData()

            })
        }

    }

    async loadMore() {
        this.state.page_no = this.state.page_no + 1;
        const axios = require('axios');
        var agency_code = await AsyncStorage.getItem('agency_code');
        var startOfWeek = moment().startOf('isoWeek');
        var endOfWeek = moment().endOf('isoWeek');

        console.log("start : ", startOfWeek.format('YYYY-MM-DDTHH:mm:ssZ'), " end : ", endOfWeek.format('YYYY-MM-DDTHH:mm:ssZ'))
        var url = Globals.httpMode + agency_code  + Globals.domain + '/api/v1/shifts?start_time=&end_time=&page=' + this.state.page_no + '&per_page=' + this.state.per_page + '&include_status[]=canceled by client';
        console.log("url : ", url);

        try {

            //var response = await this.props.data.formRequest.get(url);
            var access_token = this.props.data.access_token;
            console.log("acc : ", access_token);
            const headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'App-Token': '96ef950f-bfae-4ee5-89a0-f23ab9e50b96',
                'Authentication-Token': access_token
            }
            try {
                var response = await axios.get(url, {
                    headers: headers
                })
                if (response.status === 200) {
                    if (response.data !== null) {
                        this.setState({

                            data: this.state.data.concat(response.data.shifts), loading: false
                        })
                    }
                    else {
                        this.state.page_no = this.state.page_no - 1;
                    }
                }
                else {
                    this.showToast("Invalid Credentials");
                }
            }
            catch (error) {
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

    pstToLocal(start_time) {
        var time = null;

        this.state.shift_date = moment(start_time).format("DD-MM-YYYY");
        time = moment(start_time).format('hh:mm a');

        return time;
    }

    render() {
        if (this.state.loading) {
            return <LoadingIndicator />
        }
        else {
            var clientData = this.state.data;

            return (
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={[commonStyles.margin, commonStyles.full]}>
                        <View style={[commonStyles.margin, styles.itemRectangleShape, commonStyles.row]} >
                            <Image style={[styles.search]}
                                source={require('../../../assets/images/search.png')} />

                            <TextInput style={{ height: hp('6%'), width: wp('80%'), marginLeft: wp('2%') }} placeholder="Search by Client Name"
                                value={this.state.searchInput}
                                onChangeText={(text) => this.SearchFilterFunction(text)}
                                onClear={text => this.setState({ page_no: 0 }, () => { this.getCurrentData() })} />
                        </View>
                        {
                            clientData.length > 0 ?
                                <FlatList
                                    data={clientData}
                                    renderItem={({ item }) => {

                                        return (
                                            <View style={[commonStyles.margin, commonStyles.full]}>
                                                {
                                                    <View style={commonStyles.coloumn}>

                                                        <View style={[styles.itemRectangleShape, commonStyles.coloumn, { padding: wp('3%') }]} >
                                                            <View style={[commonStyles.row, commonStyles.full, { justifyContent: 'flex-start', alignItems: 'center' }]}>
                                                                {
                                                                    item.client[_.keys(item.client)[0]].avatar_url ? <View>
                                                                        <Image style={[styles.clientImage]}
                                                                            source={{ uri: item.client[_.keys(item.client)[0]].avatar_url }} />
                                                                    </View> : (
                                                                            <View style={[commonStyles.center, { width: wp('12.5%'), height: hp('6%'), backgroundColor: '#f1f2f4', borderColor: '#c7c7c7', borderWidth: wp('0.1%'), borderRadius: 5 }]}>
                                                                                <Text style={[commonStyles.fs(3.5), { color: StyleConstants.gradientStartColor }]}>{item.client[_.keys(item.client)[0]].name.charAt(0).toUpperCase()}</Text>
                                                                            </View>
                                                                        )
                                                                }
                                                                <Text style={{ marginLeft: wp('2%'), justifyContent: 'center', alignItems: 'flex-start', fontSize: hp('2.3%'), color: '#293D68', fontFamily: 'Catamaran-Regular' }}>{item.client[_.keys(item.client)[0]].name}</Text>
                                                            </View>

                                                            <View style={styles.line} />

                                                            <View style={[commonStyles.full, commonStyles.row, commonStyles.mt(1.5)]}>
                                                                <View style={[commonStyles.row, commonStyles.center, commonStyles.full, { justifyContent: 'flex-start' }]}>
                                                                    <Image style={[styles.smallImage]}
                                                                        source={require('../../../assets/images/clock.png')} />
                                                                    <Text style={[{ textAlignVertical: 'center', fontSize: hp('1.7%'), textAlign: 'center', color: '#293D68', fontFamily: 'Catamaran-Regular', }, commonStyles.ml(1)]}>{this.pstToLocal(item.start_time) + " - " + this.pstToLocal(item.end_time)}</Text>
                                                                </View>

                                                                <View style={[commonStyles.row, commonStyles.center, commonStyles.full, { justifyContent: 'flex-end' }]}>
                                                                    <Image style={[styles.smallImage]}
                                                                        source={require('../../../assets/images/calendar.png')} />
                                                                    <Text style={[{ textAlignVertical: 'center', fontSize: hp('1.7%'), textAlign: 'center', color: '#293D68', fontFamily: 'Catamaran-Regular', }, commonStyles.ml(1)]}>{moment(item.start_time).format("LL")}</Text>
                                                                </View>
                                                            </View>

                                                            <View style={[commonStyles.full, commonStyles.row, commonStyles.mt(0.4)]}>
                                                                <View style={[commonStyles.row, commonStyles.full, { justifyContent: 'flex-start' }]}>
                                                                    <Image style={[styles.smallImage, { marginTop: 6 }]}
                                                                        source={require('../../../assets/images/location.png')} />
                                                                    <TouchableOpacity onPress={() => {
                                                                        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
                                                                        const latLng = `${item.latitude},${item.longitude}`;
                                                                        const label = 'Custom Label';
                                                                        const url = Platform.select({
                                                                            ios: `${scheme}${item.location}`,
                                                                            android: `${scheme}${item.location}`
                                                                        });


                                                                        Linking.openURL(url);
                                                                    }}>
                                                                        <Text style={[{ textAlignVertical: 'center', fontSize: hp('1.7%'), textAlign: 'left', color: '#293D68', fontFamily: 'Catamaran-Regular', color: '#41A2EB', textDecorationLine: 'underline' }, commonStyles.ml(1)]}>{item.location!=null?item.location:'---'}</Text>

                                                                    </TouchableOpacity>
                                                                </View>

                                                                <View style={[commonStyles.row, commonStyles.full, { justifyContent: 'flex-end' }]}>

                                                                </View>
                                                            </View>
                                                        </View>

                                                    </View>
                                                }
                                            </View>
                                        )
                                    }}
                                    keyExtractor={(item, index) => index.toString()}
                                    // ItemSeparatorComponent={this.renderSeparator}
                                    // ListFooterComponent={this.renderFooter.bind(this)}
                                    // onEndReachedThreshold={0.4}
                                    onEndReached={() => {
                                        this.loadMore()
                                    }}
                                />
                                : <View style={[commonStyles.margin, commonStyles.full, { justifyContent: 'center', alignItems: 'center' }]}>
                                    <Text style={{ marginTop: hp('5%'), justifyContent: 'center', alignItems: 'center', fontSize: hp('2.3%'), color: '#293D68', fontFamily: 'Catamaran-Regular' }}>No Data found</Text>
                                </View>
                        }

                    </View>
                </ScrollView>
            );
        }

    }
}

const styles = StyleSheet.create({
    itemRectangleShape: {
        marginTop: wp('3%'),
        borderWidth: 0.01,
        borderTopRightRadius: 5,
        borderTopLeftRadius: 5,
        backgroundColor: '#fff',
        borderColor: '#fff'
    },
    clientImage: {
        width: wp('6%'), height: hp('6%'),
        aspectRatio: 1,
        borderColor: '#fff',
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        borderTopRightRadius: 8,
        borderTopLeftRadius: 8,
    },
    smallImage: {
        width: wp('3%'),
        height: hp('3%'),
        aspectRatio: 1,
    },
    line: {
        marginTop: wp('2%'),
        borderWidth: 0.25,
        borderColor: '#828EA5',
    },
    search: {
        marginLeft: wp('3%'),
        justifyContent: 'center',
        alignSelf: 'center',
        width: wp('4%'),
        height: hp('4%'),
        aspectRatio: 1
    },
});