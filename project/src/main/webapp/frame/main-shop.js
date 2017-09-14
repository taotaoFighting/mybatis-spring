(function() {
  cola(function(model) {
	$.ajax({
		contentType : 'application/json;charset=UTF-8',
		url : './service/capDictCategorys/dictAll/',
		type : 'GET',
		dataType : 'json',
		success : function(data) {
			window._picchDict = data;
		},
		error : function() {
		
		}
	});
  	tipLabel=function($dom,event) {
		var _this = $($dom);
		var _parentDom = $($dom).parent();
		var tooltip = $("<div class='just-tooltip'><div class='just-con'>" + _this.text() + "</div>" + "<span class='just-right'></span></div>");
		$("body").append(tooltip);
		var div = $("div.just-tooltip");
		div.css({"top":(_this.offset().top-10)+"px","left":(_parentDom.outerWidth()+10)+"px","opacity":0.6});
	    div.animate({left:(_parentDom.outerWidth())+"px",opacity:'0.9'},"normal");
	};
	tipLabelOut=function() {
		$("div.just-tooltip").remove();
	};
    var appName, errorCount, login, loginCallback, logo, longPollingTimeOut, showLoginMessage;
    logo = App.prop("app.logo.path");
    appName = App.prop("app.name");
    if (logo) {
      $("#appHeader").append($.xCreate({
        tagName: "img",
        "class": "img ui image",
        src: logo
      }));
    }
    if (appName) {
      $("#appHeader").append($.xCreate({
        tagName: "span",
        style:"letter-spacing:2px;",
        content: appName
      }));
    }
    model.describe("menus", {
      provider: {
        url: App.prop("service.menus")
      }
    });
    model.describe("user", {
      provider: {
        url: App.prop("service.user.detail")
      }
    });
    
    var loginUser=App.getLoginUser();
    var position = loginUser.position;
    var userName=loginUser.username;
    var cname=loginUser.cname;
    var companyId=loginUser.companyId;
    var orgCode=loginUser.orgCode;
    var welcomeUserMsg;
    if (position!="null") {
    	welcomeUserMsg="欢迎您 "+position+cname;
    } else {
    	welcomeUserMsg="欢迎您 "+cname;
    }
    if(userName){
    	welcomeUserMsg+="（"+userName+"）";
    }
    model.set({"welcomeUserMsg":welcomeUserMsg});
    model.dataType({
      name: "Login",
      properties: {
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
      }
    });
    model.describe("login", "Login");
    model.set("login", {});
    model.set("messages", {});
    errorCount = 0;
    longPollingTimeOut = null;
    window.refreshMessage = function() {
      var options;
      options = {};
      if (longPollingTimeOut) {
        clearTimeout(longPollingTimeOut);
      }
      if (App.prop("longPollingTimeout")) {
        options.timeout = App.prop("longPollingTimeout");
      }
      return $.ajax(App.prop("service.messagePull"), options).done(function(messages) {
        var i, len, message;
        if (messages) {
          errorCount = 0;
          for (i = 0, len = messages.length; i < len; i++) {
            message = messages[i];
            model.set("messages." + message.type, message.content);
          }
        }
        if (App.prop("liveMessage")) {
          return longPollingTimeOut = setTimeout(refreshMessage, App.prop("longPollingInterval"));
        }
      }).error(function(xhr, status, ex) {
        if (App.prop("liveMessage")) {
          if (status === "timeout") {
            return longPollingTimeOut = setTimeout(refreshMessage, App.prop("longPollingInterval"));
          } else {
            errorCount++;
            return longPollingTimeOut = setTimeout(refreshMessage, 5000 * Math.pow(2, Math.min(6, errorCount - 1)));
          }
        }
      });
    };
    longPollingTimeOut = setTimeout(refreshMessage, 1000);
    refreshMessage();
    loginCallback = null;
    window.login = function(callback) {
      model.set('login',{"companyOrgcode":orgCode,"userName":userName});
      cola.widget("loginDialog").show();
      if (callback && typeof callback === "function") {
        return loginCallback = callback;
      }
    };
    login = function() {
      var data;
      data = model.get("login");
      var f = $('<form><input name=\'username_\' value=\''+data.get('companyOrgcode')+"."+data.get('userName')+'\'/><input name=\'password_\' value=\''+data.get('password')+'\'/></form>');
  	  var data=f.serialize();
      cola.widget("containerSignIn").addClass("loading");
      return $.ajax({
    	  type: "POST",
          url: App.prop("service.login"),
          dataType:"json",
          data: data
      }).complete(function(result) {
        var callback;
        cola.widget("containerSignIn").removeClass("loading");
        var state=result.status;
		 if(state==200){
			  if(result.responseText){
				  try{
					  var json=JSON.parse(result.responseText);
					  if(json.login=='success'){
					      cola.widget("loginDialog").hide();
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
        cola.widget("loginDialog").hide();
        if (loginCallback) {
          callback = loginCallback;
          loginCallback = null;
          return callback();
        }
      }).fail(function() {
        cola.widget("containerSignIn").removeClass("loading");
      });
    };
    model.widgetConfig({
      loginDialog: {
        $type: "dialog",
        width: 400,
        closeable:false
      },
      subMenuTree: {
        $type: "tree",
        autoExpand: true,
        bind: {
          expression: "menu in subMenu",
          child: {
            recursive: true,
            expression: "menu in menu.menus"
          }
        }
      },
      subMenuLayer: {
        beforeShow: function() {
          return $("#viewTab").parent().addClass("lock");
        },
        beforeHide: function() {
          return $("#viewTab").parent().removeClass("lock");
        }
      }
    });
    showLoginMessage = function(content) {
      return cola.widget("formSignIn").setMessages([
        {
          type: "error",
          text: content
        }
      ]);
    };
    model.action({
      signIn: function() {
        var data;
        cola.widget("formSignIn").setMessages(null);
        data = model.get("login");
        if (data.validate()) {
          return login();
        } else {
          return showLoginMessage("公司机构代码 用户名或密码不能为空！");
        }
      },
      dropdownIconVisible: function(item) {
        var menus, result;
        menus = item.get("menus");
        result = false;
        if (menus && menus.entityCount > 0) {
          result = true;
        }
        return result;
      },
      showUserSidebar: function() {
        return cola.widget("userSidebar").show();
      },
      hasChild: function(item) {
        var menu, ref;
        menu = item.toJSON();
        if ((ref = menu.menus) != null ? ref.length : void 0) {
          return "";
        } else {
          return "link";
        }
      },
      logout: function() {
    	  window.location=App.prop("service.logout");
          /*return $.ajax({
            type: "POST",
            url: App.prop("service.logout")
          }).done(function(result) {
            if (result.type) {
              return window.location.reload();
            }
          }).fail(function() {
            alert("退出失败，请检查网络连接！");
          });*/
      },
      menuItemClick: function(item) {
        var data, menus;
        data = item.toJSON();
        menus = data.menus;
        if (!(menus != null ? menus.length : void 0)) {
          model.set("subMenu", []);
          cola.widget("subMenuLayer").hide();
          App.open(data.path, data);
          return $(".shop-menu.wrapper>ul>li.hover").removeClass("hover");
        }
      },
      hideSubMenuLayer: function() {
        return cola.widget("subMenuLayer").hide();
      },
      toggleSidebar: function() {
        var $dom, className;
        className = "collapsed";
        $dom = $("#frameworkSidebarBox");
        return $dom.toggleClass(className, !$dom.hasClass(className));
      },
      messageBtnClick: function() {
        var action;
        action = App.prop("message.action");
        if (action && typeof action === "object") {
          App.open(action.path, action);
        }
      },
      taskBtnClick: function() {
        var action;
        action = App.prop("task.action");
        if (action && typeof action === "object") {
          return App.open(action.path, action);
        }
      },
      toBeCollecing :function(colleceData){
    	  //进行收藏
    	  $.ajax({
  			url: "service/hinsCollectListAdd",
  			type: "POST",
  			data: JSON.stringify(colleceData),
  			datatype: "json",
  			contentType:'application/json;charset=UTF-8',
  			success: function(data) {
  				$("#collece-showHide").find("i").removeClass("empty");
  				cola.alert("收藏成功!", {
                      level: "info"
                  });
  			}
  		});
      },
      toBeColleced: function(){
    	  //选择收藏项进行收藏
    	  var colleceData, currentTabIndex, tabbutton = $("c-tabbutton");
    	  if(tabbutton){
    		  for(var i=0; i<tabbutton.length; i++){
    			  if(tabbutton[i].className.indexOf("active") > -1){
    				  currentTabIndex = i;
    			  }
    		  }
    	  }else{
    		  return;
    	  }
    	  var currentTab = cola.widget("viewTab").getTab(currentTabIndex);
    	  colleceData = {
    			  "name": currentTab.get("caption"),
    			  "icon": currentTab.get("icon"),
    			  "url": currentTab.get("name")  
    	  }
    	  //判断是否已经收藏过
			$.ajax({
				url: "service/isExistHinsCollect",
				type: "POST",
				datatype: "json",
				data:JSON.stringify({url:colleceData.url}),
				contentType:'application/json;charset=UTF-8',
				success: function(data) {
			    	  if(data.status){
	    				  cola.alert("已经收藏", {
	    					  level: "warning"
	    				  });
			    	  }else{
			    		  model.action.toBeCollecing(colleceData);
			    	  }
				},
				error: function(){
					 cola.alert("数据异常!", {
                         level: "warning"
                     });
				}
			}); 
      }
    });
    setTimeout(function() {
      return $(".shop-menu.wrapper>ul>li:not(.link)").hover(function() {
        var oldItem;
        oldItem = $(this).parent().children('li.hover')[0];
        if (oldItem) {
          if (oldItem === this) {

          } else {
            $fly(oldItem).removeClass("hover");
            return $fly(this).addClass("hover");
          }
        } else {
          return $fly(this).addClass("hover");
        }
      }, function() {
        return $fly(this).removeClass("hover");
      });
    }, 1000);
    return $("#rightContainer>.layer-dimmer").on("click", function() {
      return cola.widget("subMenuLayer").hide();
    });
  });

  cola.ready(function() {
    var workbench;
    workbench = App.prop("workbench");
    if (workbench) {
      return App.open(workbench.path, workbench);
    }
  });
  
}).call(this);
