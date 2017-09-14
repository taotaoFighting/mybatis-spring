(function() {
  cola(function(model) {
    $(".ui.accordion").accordion({
      exclusive: false
    }); 
    
    model.set("categoryCode", "bizType");
	model.describe("bizTypes", {
		provider : {
			url : "./service/selectCapDictItem/" + model.get("categoryCode")
					+ "/"
		}
	});
	
	
	model.get("bizTypes");
	
	  
    model.set("condition",{});	
	
    
    model.dataType({
    	
	    name: "CapAccount",
	    properties: {
	    	
	    	
	    	bizType: {
	    		validators:["required"]
	        },
	        bankCode: {
	        	validators:["required"]
	        },
	        instCode: {
	        	validators:["required"]
	        },
	        accountCode: {
	        	validators:["required"]
	        },	       
	        
	    	
	        capCompanyInfo:{}
	        
	    }
	});
    
	model.describe("capaccounts", {
    	
	      dataType:  "CapAccount",
	            
	      provider: {
	    	 
	        name: "provider1",
	        url: "./service/capAccount/search",
	        pageSize: 5,
	        beforeSend: function(self, arg) {
	        	
				var condition = model.get("condition");
				var parameter=condition.toJSON();
				if (condition != null) {
	        		return arg.options.data.parameter = JSON.stringify(parameter);
	        	}
				
	        }
	            
	      }
	    });
	    
	    model.describe("entityCapAccount", "CapAccount");
    
    

    
    
    model.action({
    	mappingBizType : function(key) {
			var result;
			result = key;
			if (model.get("bizTypes")) {
				model.get("bizTypes").each(function(bizType) {

					if (bizType.get("key") == key) {
						result = bizType.get("value");
						return false;
					}
				});
			}
			
			return result;
		},
      getColor: function(status) {
        if (status === "完成") {
          return "positive-text";
        } else {
          return "negative-text";
        }
      },
      search: function() {
   
         return model.flush("capaccounts");
      },
      add: function() {
    	  var bankCode=App.getLoginUser().bankCode;
			var instCode=App.getLoginUser().instCode;
			
		
    	  if (bankCode=="null" && instCode!="null") {
				model.set("entityCapAccount",{
					bankCode:"",
					instCode:instCode
				});
			}else if (instCode=="null" && bankCode!="null") {
				model.set("entityCapAccount",{
					bankCode:bankCode,
					instCode:""
				});
			}else if (bankCode=="null" && instCode=="null") {
				model.set("entityCapAccount",{
					bankCode:"",
					instCode:""
				});
			}else {
				model.set("entityCapAccount",{
					bankCode:bankCode,
					instCode:instCode
				});
			}
        model.get("entityCapAccount").setState("new");
        
        return cola.widget("editLayer").show();
      },
      edit: function(item) {

    	model.set("entityCapAccount", item.toJSON());
        return cola.widget("editLayer").show();
      },
      cancel: function() {
        return cola.widget("editLayer").hide();
      },
      ok: function() {
        var data, entityCapAccount, id, validate, result;
        
        
        entityCapAccount = model.get("entityCapAccount");
        if (entityCapAccount.state == "new") {
        	entityCapAccount.set("createUser",
					App.getLoginUser().cname);
		} else if (entityCapAccount.state == "modified") {
			entityCapAccount.set("updateUser",
					App.getLoginUser().cname);
		}
        
		result = entityCapAccount.validate();
		if (result) 
		{
       		
			data=entityCapAccount.toJSON();
			       
			NProgress.start();
			return $.ajax("./service/capAccount/", {
            data: JSON.stringify(data),
            type: entityCapAccount.state != "new" ? "PUT" : "POST",
            contentType: "application/json",
            complete: function() {
            	
            	if(entityCapAccount.state=="new")
				{	
            		cola.widget("editLayer").hide();
            		model.flush("capaccounts");
            		entityCapAccount.state="none";
            		NProgress.done();    
              
            		cola.NotifyTipManager.success({
            			message: "添加成功!",
            			description: "后台任务执行成功！",
            			showDuration: 3000
            		});
				}
            	else if(entityCapAccount.state=="modified")
				{	
            		cola.widget("editLayer").hide();
            		model.flush("capaccounts");
            		entityCapAccount.state="none";
            		NProgress.done();    
              
            		cola.NotifyTipManager.success({
            			message: "修改成功!",
            			description: "后台任务执行成功！",
            			showDuration: 3000
            		});
				}
				
            }		
          });
		}		
      },

      del: function(item) { 	  
    	  cola.confirm("确定要删除吗？",{ onApprove:function(){
    		$.ajax("./service/capAccount/" + item.get("id")+ "/", {
    			
    			type: "DELETE",
    			
    			complete: function () {    				   				
    				model.flush("capaccounts");
    				cola.NotifyTipManager.success({
    					message: "删除成功!",
    					description: "后台任务执行成功！",
    					showDuration: 3000
    				});
    			}
    		});
    	  }  	  
    	  });
      },
      mappingIsAdmin: function(key) {
    	  	  
    	    var result;
    	    result = key;
    	    
    	    if(result==true)
    	    {
    	    	return "是";
    	    }
    	    else
    	    {
    	    	return "不是";    	    	
    	    }
    	  },   	 
    });
    
    return model.widgetConfig({
    	
    	bizTypeSelectDropDown : {
			$type : "dropdown",
			openMode : "drop",
			items : "{{bizType in bizTypes}}",
			valueProperty : "key",
			textProperty : "value",
			bind : "entityCapAccount.bizType",
			beforeOpen: function (self, arg) {
				self.set("value", "");
			}
		},
	  addAreaSidebar : {
			$type : "Sidebar",
			size : "350",
			direction : "right"
		},   	
    
      editLayer: {
        $type: "Sidebar",
        size:"350",
        direction:"right",
        onShow: function() {
          return $("#mainView").hide();
        },
        beforeHide: function() {
          return $("#mainView").show();
        }
      },
  
      capaccountTable: {
        $type: "table",
        showHeader: true,
        bind: "item in capaccounts",
        highlightCurrentItem: true,
        currentPageOnly: true,
        changeCurrentItem: true,
        columns: [
                  
       
        {
        	bind : "mappingBizType(item.bizType)",
        	caption: "业务类型"
        },
        {
        	bind: ".bankCode",
        	caption: "银行号"
        },
        {
        	bind: ".instCode",
        	caption: "机构号"
        },
        {
        	bind: ".priorityClass",
        	caption: "优先级"
        },
        {
        	bind: ".description",
        	caption: "描述",
        	width: 90
        },
        {
        	bind: ".accountCode",
        	caption: "账户代码"
        },
        {
        	bind: ".createUser",
        	caption: "创建人"
        },
        {
        	bind: "formatDate(item.createDate, 'yyyy-MM-dd HH:mm:ss')",
        	caption: "创建时间"
        },
        {
        	bind: ".updateUser",
        	caption: "更新人"
        },
        {
        	bind: "formatDate(item.updateDate, 'yyyy-MM-dd HH:mm:ss')",
        	caption: "更新时间"
        },
        {
            caption: "操作",
            align: "center",
            template: "operations"
          }
        ]
      }
    });
  });

}).call(this);




