(function() {
  cola(function(model) {
    var mainPath, showMessage, submit;
    var domItemId = {'个人用户':'item-0','专业人员':'item-1','签约机构':'item-2'}
	  var tmpDom = $('#item-0');
    model.describe({
      companyOrgcode: {
            validators: {
              $type: "required",
              message: ""
            }
          },
      userName: {
        validators: {
          $type: "required",
          message: ""
        }
      },
      password: {
        validators: {
          $type: "required",
          message: ""
        }
      }
    });
    mainPath = "" + (App.prop("mainView"));
    model.set({
    	"companyOrgcode":$.cookie("_cap_cpOrgcode_"),
    	"userName":$.cookie("_cap_userName_"),
    	 path: "/"
    });
    showMessage = function(content) {
      return cola.widget("formSignIn").setMessages([
        {
          type: "error",
          text: content
        }
      ]);
    };
    submit = function() {
      var data;
      data = model.get();
      cola.widget("containerSignIn").addClass("loading");
      var f = $('<form><input name=\'username_\' value=\''+data.get('companyOrgcode')+"."+data.get('userName')+'\'/><input name=\'password_\' value=\''+data.get('password')+'\'/></form>');
  	  var data=f.serialize();
      return $.ajax({
        type: "POST",
        url: App.prop("service.login"),
        dataType:"json",
        data: data
      }).complete(function(result) {
		 cola.widget("containerSignIn").removeClass("loading");
		 var state=result.status;
		 if(state==200){
			  if(result.responseText){
				  try{
					  var json=JSON.parse(result.responseText);
					  if(json.login=='success'){
						  window.location=json.url;
						  if (model.get("cacheInfo")) {
					          $.cookie("_cap_cpOrgcode_",model.get("companyOrgcode"),{
					            path: "/",
					            expires: 30
					          });
					          $.cookie("_cap_userName_",model.get("userName"),{
						            path: "/",
						            expires: 30
						      });
					      }
						  $.cookie("_cap_userName1_",model.get("userName"),{
					            path: "/",
					            expires: 30
					      });			
						  $.cookie("_cap_cpOrgcode1_",model.get("companyOrgcode"),{
					            path: "/",
					            expires: 30
					      });
						  $.cookie("_cap_userCname_",json.cname,{
							  path: "/",
							  expires: 30
						  });
						  $.cookie("_cap_userCpId_",json.cpId,{
							  path: "/",
							  expires: 30
						  });
						  $.cookie("_cap_cpName_",json.cpName,{
							  path: "/",
							  expires: 1
						  });
						  $.cookie("_cap_cpFName_",json.cpFName,{
							  path: "/",
							  expires: 1
						  });
						  $.cookie("_cap_bankCode_",json.bankCode,{
							  path: "/",
							  expires: 1
						  });	
						  $.cookie("_cap_instCode_",json.instCode,{
							  path: "/",
							  expires: 1
						  });
						  $.cookie("_cap_cpType_",json.cpType,{
							  path: "/",
							  expires: 1
						  });
						  $.cookie("_cap_position_",json.position,{
							  path: "/",
							  expires: 1
						  });
						  return;
					  }else if(json.login=='failure'){
						  if(json.msg=='BadUsernameorpassword'){
							  showMessage('公司机构代码 用户名或密码不正确');
						  }else{
							  showMessage(json.msg);
						  }
						  return;
					  }
				  }catch(e){
					  showMessage('登录失败，错误代码001');
					  return;
				  }
			  }
		}
        if (!result.type) {
          showMessage(result.message);
          return;
        }
        return window.location = mainPath;
      }).fail(function() {
        cola.widget("containerSignIn").removeClass("loading");
      });
    };
    checkSubmit=function(){
    	 var data;
         cola.widget("formSignIn").setMessages(null);
         data = model.get();
         if (data.validate()) {
           return submit();
         } else {
           return showMessage("公司机构代码 用户名和密码均不能为空！");
         }
    }
    return model.action({
      
      signIn: function() {
    	  checkSubmit();
      },
      
      autoLogin:function(){
    	  var keycode=event.keyCode==null?event.which:event.keyCode;
          if(keycode==13) {
        	  checkSubmit();
       	  }
       },
      
      showHideQrcode:function(){
      	//显示隐藏二维码
      	if(cola.widget("carousel").get("display") == true){
	      	cola.widget("carousel").set("display", false);
	      	cola.widget("qrcode").set("display", true);
      	}else{
      			cola.widget("carousel").set("display", true);
      			cola.widget("qrcode").set("display", false);
      	}
      },
      itemClick:function(obj){
	      var dom = $('#'+ domItemId[obj.text]);
	      var x = dom.position().left+dom.width()/2+63;
	    	$('.tangle').animate({left:x});
	    	tmpDom.removeClass('primary-text');//移除上一个标签的红色
	    	tmpDom.addClass('black-text');//添加上一个标签的黑色字体
	    	tmpDom = dom;
	    	dom.removeClass('black-text');//同上
	    	dom.addClass('primary-text');
	    	cola.widget('carousel').setCurrentIndex(domItemId[obj.text].substr(5,1))
	    }
    });
  });
  
  cola.on("ready", function(){
		//隐藏轮播的按钮和点
		$(".indicators, .controls").hide();
	})
}).call(this);
