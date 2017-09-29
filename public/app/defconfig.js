
var defcfg = {
    // config:
      'screen_saver': {'type':'input','range':'0-45','position':1}
////    , 'back_light': 'Turn display off [0/1]'
    , 'watches': {'type':'sel','options':'analog,digital,none','position':2}
    , 'brightness': {'type':'input','range':'20-255','position':3}
    , 'dnd_mode': {'type':'sel','options':'True,False','position':4}
    , 'outgoing_calls': {'type':'sel','options':'1,0','position':5}
    , 'sip_mode': {'type':'sel','options':'SIP server,peer-to-peer','position':1}
    , 'sip_username': {'type':'input','range':'','position':4}
    , 'sip_server_addr': {'type':'input','range':'','position':2}
    , 'sip_p4ssw0rd': {'type':'input','range':'','position':6}
    , 'sip_port': {'type':'input','range':'','position':3}
    , 'sip_authentication_name': {'type':'input','range':'','position':5}
    , 'ringtone': {'type':'sel','options':'tone1.wav,tone2.wav,oldphone.wav','position':1}
    , 'volume': {'type':'input','range':'20-100','position':2}
    , 'micvolume': {'type':'input','range':'20-100','position':3}
    , 'screen_mode': {'type':'sel','options':'1,2,4','position':1}
    , 'screen_orientation': {'type':'sel','options':'0,90,180,270','position':2}
    , 'server_ip_address_1': {'type':'input','range':'','position':1}
    , 'server_ip_address_2': {'type':'input','range':'','position':5}
    , 'server_ip_address_3': {'type':'input','range':'','position':9}
    , 'server_ip_address_4': {'type':'input','range':'','position':13}
    , 'server_stream_1': {'type':'input','range':'','position':3}
    , 'server_stream_2': {'type':'input','range':'','position':7}
    , 'server_stream_3': {'type':'input','range':'','position':11}
    , 'server_stream_4': {'type':'input','range':'','position':15}
    , 'sip_call1': {'type':'input','range':'','position':2}
    , 'sip_call2': {'type':'input','range':'','position':6}
    , 'sip_call3': {'type':'input','range':'','position':10}
    , 'sip_call4': {'type':'input','range':'','position':14}
    , 'picture_1': {'type':'sel','options':'fill,4:3,16:9','position':4}
    , 'picture_2': {'type':'sel','options':'fill,4:3,16:9','position':8}
    , 'picture_3': {'type':'sel','options':'fill,4:3,16:9','position':12}
    , 'picture_4': {'type':'sel','options':'fill,4:3,16:9','position':16}
    , 'broadcast': {'type':'input','range':'','position':2}
    , 'netmask': {'type':'input','range':'','position':4}
    , 'network': {'type':'input','range':'','position':6}
    , 'dns': {'type':'input','range':'','position':5}
    , 'ipaddress': {'type':'input','range':'','position':2}
    , 'gateway': {'type':'input','range':'','position':3}
    , 'inet': {'type':'sel','options':'dhcp,static','position':1}
    , 'serial': {'type':'input','range':'','position':3}
    , 'app_name': {'type':'input','range':'','position':1}
    , 'app_ver': {'type':'input','range':'','position':2}
//    , 'uptime': 'PRi operaton uptime'
    , 'licencekey': {'type':'input','range':'','position':4}
    , 'regaddress': {'type':'input','range':'','position':5}
    , 'masterpwd': {'type':'input','range':'','position':1}
    , 'app_log': {'type':'sel','options':'debug,info,warning,error','position':2}
    , 'sip_log': {'type':'sel','options':'debug,info,warning,error','position':3}
    , 'tunnel_flag': {'type':'sel','options':'0,1','position':4}
    , 'autoupdate': {'type':'sel','options':'0,1','position':5}
    , 'update_repo': {'type':'sel','options':'production,development','position':6}
    , 'timezone': {'type':'timezone','position':1}

};