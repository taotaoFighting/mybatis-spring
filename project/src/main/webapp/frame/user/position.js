(function() {
  cola(function(model) {
    $(".ui.accordion").accordion({
      exclusive: false
    }); 
    model.dataType({
		name : "CapCompanyInfo",
		properties : {
			capcompanyinfos : {
				dataType : "CapCompanyInfo",
				provider : {
					url : "./service/frame/company/tree/?parentId={{@id}}",
					
				}
			}
		}
	});
	model.describe("capcompanyinfos", {
		dataType : "CapCompanyInfo",
		provider : {
			url : "./service/frame/company/tree/",
			complete: function(self, arg) {
				//cola.widget("SystemDropDown").set("value",App.getLoginUser().companyName);
				
			}
				
		}
		
	});
    model.get("capcompanyinfos");
	
		
	
	model.dataType({
	    name: "CapPosition",
	    properties: {
	    	
	    	id: {
	        	validators:["required"]
	        },
	        
	        name: {
	        	validators:["required"]
	        },
	        
	        desc: {
	        	validators:["required"]
	        }
	           
	        //capCompanyInfo:{}
	        
	    }
	});

	model.set("companyId", App.getLoginUser().companyName);
	model.describe("cappositions", {
    	
	      dataType: "CapPosition",
	      provider: {
	    	 
	        name: "provider1",
	        url: "./service/capPosition/search",
	        pageSize: 5,
	        beforeSend: function(self, arg) {  
	        	
	        	
		        if (model.get("companyId")==App.getLoginUser().companyName){
		        		arg.options.data.companyId=App.getLoginUser().companyId;
		        } else {
		        		arg.options.data.companyId=model.get("companyId");  
		        	}     	
		    }

	        
	     }
	
	 });
	 model.describe("entityCapPosition", "CapPosition");
	 model.get("cappositions");

    
    model.action({
      getColor: function(status) {
        if (status === "完成") {
          return "positive-text";
        } else {
          return "negative-text";
        }
      },
      search: function() {
         return model.flush("cappositions");
      },
      add: function() {
    	 
    	  cola.widget("positionId").set("readOnly",false);
        model.set("entityCapPosition", {});
        //entityCapUser.state="new";
        model.get("entityCapPosition").setState("new");
        
        return cola.widget("editLayer").show();
      },
      edit: function(item) {
    	
    	  cola.widget("positionId").set("readOnly",true);
    	model.set("entityCapPosition", item.toJSON());
        return cola.widget("editLayer").show();
      },
      cancel: function() {
        return cola.widget("editLayer").hide();
      },
      ok: function() {
        var data, entityCapPosition, id, validate, result;
        
        
        entityCapPosition = model.get("entityCapPosition");
		result = entityCapPosition.validate();
		if (result) 
		{

			//model.set("entityCapPosition.companyId",App.getLoginUser().companyId);
			
			if (model.get("companyId")==App.getLoginUser().companyName){
				model.set("entityCapPosition.companyId",App.getLoginUser().companyId);
        	} else {
        		model.set("entityCapPosition.companyId",model.get("companyId"));
        	}
			entityCapPosition = model.get("entityCapPosition");
		
			
			
			data=entityCapPosition.toJSON();
			delete data.companyName;
			//data={username:'user4',capCompanyInfo:{id:'1'}};
			NProgress.start();
			return $.ajax("./service/capPosition/", {
            data: JSON.stringify(data),
            type: entityCapPosition.state != "new" ? "PUT" : "POST",
            contentType: "application/json",
            
            success: function(self, arg) {			
				if(entityCapPosition.state=="new")
				{
				
				    cola.widget("editLayer").hide();
	                model.flush("cappositions");
	                entityCapPosition.state="none";
	                NProgress.done();
	              
	              
			        cola.NotifyTipManager.success({
			        message: "添加成功!",
				    description: "后台任务执行成功！",
				    showDuration: 3000
			    
			      });
				}else if (entityCapPosition.state=="modified") {
					
					cola.widget("editLayer").hide();
		            model.flush("cappositions");
		            entityCapPosition.state="none";
		            NProgress.done();
		              
		              
				    cola.NotifyTipManager.success({
					message: "修改成功!",
					description: "后台任务执行成功！",
					showDuration: 3000
				    });
				}
				
				
			}
//            complete: function() {
//              cola.widget("editLayer").hide();
//              model.flush("cappositions");              
//              entityCapPosition.state="none";
//              NProgress.done();
//              
//			  cola.NotifyTipManager.success({
//				message: "添加成功!",
//				description: "后台任务执行成功！",
//				showDuration: 3000
//			  });
//				
//            }
          });
		}
      },

      
      del: function(item) {
    	      			
    	  
    	  cola.confirm("确定要删除吗？",{ onApprove:function(){
    		$.ajax("./service/capPosition/" + item.get("id")+ "/", {
    			
    			type: "DELETE",
    			complete: function () {	
    				model.flush("cappositions");
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
    	
    	SystemDropDown : {
			$type : "customDropdown",
			openMode : "drop",
			bind:"companyId",
			valueProperty : "id",
			textProperty : "name",
			content : {
				$type : "tree",
				bind : {
					hasChildProperty : "isDir",
					expression : "capcompanyinfo in capcompanyinfos",
					valueProperty : "id",
					textProperty : "name",
					child : {
						recursive : true,
						hasChildProperty : "isDir",
						textProperty : "name",
						valueProperty : "id",
						expression : "capcompanyinfo in capcompanyinfo.capcompanyinfos"
					}
				},
				itemClick : function(self, arg) {
										
					var companyId = arg.item._data._data.id;
					model.set("companyId", companyId);
					model.set("parentId", "-1");
							
					var dropdown = cola.findDropDown(self);
					if (dropdown)
						dropdown.close(arg.item.get("data"));
				}
			}
		},	
//		SystemDropDown1 : {
//			$type : "customDropdown",
//			openMode : "drop",
//			bind:"entityCapPosition.companyId",
//			valueProperty : "id",
//			textProperty : "name",
//			content : {
//				$type : "tree",
//				bind : {
//					hasChildProperty : "isDir",
//					expression : "capcompanyinfo in capcompanyinfos",
//					valueProperty : "id",
//					textProperty : "name",
//					child : {
//						recursive : true,
//						hasChildProperty : "isDir",
//						textProperty : "fullName",
//						valueProperty : "id",
//						expression : "capcompanyinfo in capcompanyinfo.capcompanyinfos"
//					}
//				},
//				itemClick : function(self, arg) {
//					
//					
//					var companyId = arg.item._data._data.id;
//					model.set("companyId", companyId);
//					model.set("parentId", "-1");
//					
//					
//					var dropdown = cola.findDropDown(self);
//					if (dropdown)
//						dropdown.close(arg.item.get("data"));
//				}
//			}
//		},	
		
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
  
      cappositionTable: {
        $type: "table",
        showHeader: true,
        bind: "item in cappositions",
        highlightCurrentItem: true,
        currentPageOnly: true,
        changeCurrentItem: true,
        columns: [
                  
        {
        	bind: ".companyName",
        	caption: "公司名"
        },
        {
        	bind: ".name",
        	caption: "岗位"
        },
        {
        	bind: ".desc",
        	caption: "岗位描述"
        },
        {
        	bind: "formatDate(item.createDate, 'yyyy-MM-dd')",
        	caption: "创建时间"
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




