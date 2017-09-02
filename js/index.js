var token = {sess_token:$_GET('sess_token')}  
var signDraw={
    timer:0,//中奖名单轮播计数器
    degValue:0,//转盘旋转角度
    h:0,//中奖名单轮播移动的距离
    //获取活动相关信息//跳转分享页面
    getActData:function(){
        var act_id={act_id:$_GET('id'),sess_token:$_GET('sess_token')};
        $.getJSON(_ACTHOST+'/userDraw/Draw/actInfo?callback=?',act_id,function(data){
            //H5通知客户端显示分享按钮//会判断是否登录APP，如果未登录自动跳转登录页面
            if(data.code!=200){
                toast2(data.msg);
                return;
            }
            if(data.data.state!=1){return;}
            $('.rate_box p').html('')
            var shareLink = data.data.link+ '&signLotteryInApp=1';
            var share_url = {share_url: window.location.href};
            var shareTitle = data.data.title;
            var shareImages = data.data.images;
            var shareDescr = data.data.descr;
            var shareType = 'act_udraw';

            //根据不同好享瘦app版本发送对应的客户端跳转协议
            myUserAgent(function(Version){
                if(Version == 2.1 && Version){
                    window.location.href = 'hxsapp://visible_share_btn|'+ shareTitle + '|' +shareLink + '|' + shareImages + '|' + shareDescr + '|' + shareType;
                }else if(Version >= 2.2 && Version <=2.6 && Version){
                    window.location.href = 'https://hxsapp_visible_share_btn#'+ shareTitle + '#' + shareLink + '#' + shareImages + '#' + shareDescr + '#' + shareType;
                }else if(Version > 2.6 && Version){
                    window.location.href = 'https://hxsapp_visible_act_share_btn#'+ shareTitle + '#' + shareLink + '#' + shareImages + '#' + shareDescr + '#' + shareType;
                }
            })        
            //qq分享
            $('#qqShareContent').attr('content',decodeURIComponent(shareTitle));
            $('#qqShareDes').attr('content','好享瘦APP  专享福利');
            $('#qqShareImg').attr('content',shareImages);$('');
            $.getJSON(_HOST+'/base/common/getWxShareJsApiSignature?callback=?', share_url ,function(data){   
                wxShare(decodeURIComponent(shareTitle), decodeURIComponent(shareDescr), shareLink, shareImages, data.data.appId, data.data.timestamp, data.data.noncestr, data.data.signature);

                //分享方法
                function wxShare(tit,describe,href,img,appid,timestamp,noncestr,signature){
                        wx.config({
                            debug: false,
                            appId: appid,
                            timestamp: timestamp, // 必填，生成签名的时间戳
                            nonceStr: noncestr, // 必填，生成签名的随机串
                            signature: signature,// 必填，签名，见附录1
                            jsApiList: ['onMenuShareTimeline', 'onMenuShareAppMessage', 'onMenuShareQQ', 'onMenuShareWeibo','onMenuShareQZone']
                        });
                        wx.ready(function(){
                            wx.onMenuShareTimeline({ //微信分享到朋友圈
                                title: tit,
                                link: href,
                                imgUrl: img,
                                success: function () {
                                },
                                cancel: function () { 
                                }
                            });

                            wx.onMenuShareAppMessage({ //微信分享给朋友
                                title: tit,
                                desc: describe,
                                link: href,
                                imgUrl: img,
                                type: '', // 分享类型,music、video或link，不填默认为link
                                dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
                                success: function () {
                                },
                                cancel: function () { 
                                }
                            });

                            wx.onMenuShareQQ({//分享到qq
                                title: tit,
                                desc: describe,
                                link: href,
                                imgUrl: img,
                                success: function () { 
                                },
                                cancel: function () {
                                }
                            });

                            wx.onMenuShareWeibo({//分享到qq微博
                                title: tit,
                                desc: describe,
                                link: href,
                                imgUrl: img,
                                success: function () { 
                                },
                                cancel: function () { 
                                }
                            });

                            wx.onMenuShareQZone({ //分享到qq空间
                                title: tit,
                                desc: describe,
                                link: href,
                                imgUrl: img,
                                success: function () { 
                                },
                                cancel: function () { 
                                }
                            });
                        });
                }
            })
        })
    },
    //开始抽奖按钮绑定动画
    startRoll:function(){
        $('#go_roll').on('click',function(){
            if($_GET('signLotteryInApp') == 1){
                toast2('快来下载好享瘦参加活动吧！');
                setTimeout(function(){
                    window.location.href = 'http://a.app.qq.com/o/simple.jsp?pkgname=com.kufeng.hj.enjoy';
                },2000)
                return false;
            }
            signDraw.judgeState();
        });
    },
    //判断返回码状态
    judgeState:function(){
        var actId={act_id:$_GET('id'),sess_token:$_GET('sess_token')};
        // var actId={act_id:63};//测试用
        $.getJSON(_ACTHOST+'/userDraw/Draw/turn?callback=?',actId,function(data){
            // data.code='200';//测试用
            switch(Number(data.code)){
                case 401://未登录跳转登录页面
                window.location.href='https://hxsapp_showloginpage';
                break;  
                case 200:
                case 201:
                signDraw.canRoll(Number(data.award_id),data);//可以旋转
                // signDraw.canRoll(7,data);//可以旋转，测试用
                break;
                case 605:
                toast2(data.msg.title);
                $('.page_1_foot').css('display','block');
                break;
                default://'601'://新用户才可抽奖哦，分享给你的朋友来抽奖吧 501://缺乏参数，拒绝处理请求 502://获取活动数据失败 602://该活动只能参加一次呢 604://活动还未开始 603//没中奖 //201 
                toast2(data.msg.title);
            }
        });  
    },
    //可以旋转
    canRoll:function(id,data){
        $('body').on('touchmove', prevent);
        $('#go_roll').off('click');
        switch(id){
            case 7:
                signDraw.degValue+= (360-signDraw.degValue%360)+2450;
                setTimeout(function(){
                    $('.can_frame p:eq(0)').html(data.msg.title);
                    $('.can_frame p:eq(1)').html(data.msg.tip);
                    signDraw.popClose('.can_frameP');
                },12500);
                break;
            case 11:
                signDraw.degValue+=(360-signDraw.degValue%360)+2590;
                setTimeout(function(){
                    $('.virtual p:eq(0)').html(data.msg.title);
                    $('.virtual p:eq(1)').html(data.msg.tip);
                    signDraw.popClose('.virtual')
                },12500);
                $('.frame').css('display','none');
                break;
            default:
            toast2(data.msg);
        };
        var deg = 'rotate(' + signDraw.degValue + 'deg' + ')';
        $('.roll_reward').css('transform', deg);
        $('.roll_ring').css('animation', 'quickroll 12s 1');
        setTimeout(function(){
            $('.roll_ring').css({
                'animation':'slowroll 30s infinite'
            });
        },12000);
    },
    //弹出框公用方法
    popupFun:function(sel){
        $('.frame').fadeIn(0);
        $(sel).fadeIn(0);
        $(sel).css('animation','bounceIn .8s 1 linear');
        $('body').on('touchmove', prevent);
    },
    //按钮关闭方法 
    closeBtn:function(sel){
        $('.frame').fadeOut(200);
        $('.child_frame').fadeOut(200);
        $('body').off('touchmove', prevent);   
    },
    bindClose:function(sel){
        $(sel).on('click',function(){
                signDraw.closeBtn();
        });
    },
    bindCloseBtn:function(){
        signDraw.bindClose('.close_btn');
        signDraw.bindClose('.cannot_backbtn');
    },
    //复用弹出框和关闭框方法
    popClose:function(sel){
        signDraw.popupFun(sel);
        signDraw.bindCloseBtn();
        signDraw.startRoll();
    },
    //获取中奖名单//中奖名单轮播
    winnerList:function(){ 
        var list=[];
        var listData=[ 
            {"name": "恭喜小晓", "draw": "抽中", "award": "女士包包"} ,
            {"name": "恭喜要瘦", "draw": "抽中", "award": "18K金钻戒"} ,
            {"name": "恭喜飞杨跋涉", "draw": "抽中", "award": "299元瘦身食谱"} ,
            {"name": "恭喜李莉", "draw": "抽中", "award": "100M三网流量"} ,
            {"name": "恭喜虾米粒", "draw": "抽中", "award": "30M三网流量"} ,
            {"name": "恭喜飞hxs", "draw": "抽中", "award": "299元瘦身食谱"} ,
            {"name": "恭喜武士", "draw": "抽中", "award": "女士包包"} ,
            {"name": "恭喜大佬", "draw": "抽中", "award": "18K金钻戒"} ,
            {"name": "恭喜幻化成蝶", "draw": "抽中", "award": "299元瘦身食谱"} ,
            {"name": "恭喜守候", "draw": "抽中", "award": "IPADMINI4"} ,
            {"name": "恭喜夏季", "draw": "抽中", "award": "30M三网流量"} ,
            {"name": "恭喜飞飞", "draw": "抽中", "award": "299元瘦身食谱"} 
        ];
        var str='';
        loading();
        function loading(){
            str='';
            list=listData.slice(0,6);
            $.each(list,function(i,msg){
                str+='<li><p>'+msg.name+'</p><p>'+msg.draw+'</p><p>'+msg.award+'</p></li>'
            })
            $('.reward_list').html(str);
        }
        signDraw.h=-$('.reward_list li:first').outerHeight();
        var hSlider=-signDraw.h*5;
        $('.reward_list').css('height',hSlider+'px');
        signDraw.timer=setInterval(function(){
            $('.reward_list li').animate({top:signDraw.h+'px'},'slow',function(){
                loading();
            }); 
            listData=listData.concat(listData.splice(0,1));
            $('.reward_list li').animate({top:''},'fast');   
        },3000)   
    }
} 
window.onload=function(){ 
    if($_GET('signLotteryInApp') == 1){
        $('.d_foot').css('display','block'); 
        $('.d_foot .colse').click(function(){
        $('.mather_main').css({
            'padding-bottom': 0
        })
        $(this).parents('div').hide();
    })
    }else{
        $('.d_foot').css('display','none'); 
    }
    signDraw.getActData();
    signDraw.winnerList();
    signDraw.startRoll();
}

function prevent (e) {
　　e.preventDefault();
}
