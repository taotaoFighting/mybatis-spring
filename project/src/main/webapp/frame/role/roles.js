(function() {
  cola(function(model) {
	  var addable, makeBody, makeNode, recursive,showPageDomTree;
	    addable = function(node) {
	      return node.nodes.length >= 1 || node.id || node.comment;
	    };
	    recursive = function(childNode) {
	      var child, comment, n, nodes;
	      nodes = [];
	      child = childNode.firstChild;
	      comment = "";
	      while (child) {
	        if (child.nodeType === 8) {
	          comment = child.nodeValue;
	        } else if (child.nodeType === 1) {
	          n = makeNode(child, comment);
	          addable(n) && nodes.push(n);
	          comment = "";
	        }
	        child = child.nextSibling;
	      }
	      return nodes;
	    };
	    makeNode = function(element, comment) {
	      var result;
	      var visible=element.getAttribute('visible')=="true";
	      var editable=element.getAttribute('editable')=="true";
	      result = {
	        tagName: element.nodeName,
	        comment: comment,
	        nodes: recursive(element),
	        id: element.id,
	        visible: visible,
	        editable: editable,
	        nodeType: element.nodeType
	      };
	      if (result.tagName === "TEMPLATE") {
	        result.name = element.getAttribute("name");
	      }
	      return result;
	    };
	    makeBody = function(nodes) {
	      var body, child, comment, i, len, node;
	      body = {
	        tagName: "body",
	        nodes: []
	      };
	      comment = "";
	      for (i = 0, len = nodes.length; i < len; i++) {
	        child = nodes[i];
	        if (child.nodeType === 8) {
	          comment = child.nodeValue;
	        } else if (child.nodeType === 1) {
	          node = makeNode(child, comment);
	          addable(node) && body.nodes.push(node);
	          comment = "";
	        }
	      }
	      return body;
	    };
        showPageDomTree=function(url){
      	    $.ajax("./service/frame/component/load", {data:{"url":url}}).done(function(result) {
      	        var body, components, findComponent, i, len, n, nodes, ref;
      	        nodes = jQuery.parseHTML(result);
      	        body = makeBody(nodes);
      	        model.set("pageBodyNode", body);
      	        components = [];
      	        findComponent = function(el) {
      	          var i, len, n, ref, results;
      	          if (el.id) {
      	            components.push(el);
      	          }
      	          ref = el.nodes;
      	          results = [];
      	          for (i = 0, len = ref.length; i < len; i++) {
      	            n = ref[i];
      	            results.push(findComponent(n));
      	          }
      	          return results;
      	        };
      	        ref = body.nodes;
      	        for (i = 0, len = ref.length; i < len; i++) {
      	          n = ref[i];
      	          findComponent(n);
      	        }
      	        return model.set("pageNodeList", components);
      	      });
        }
	    model.set("pageNodeList", []);
	    model.set("pageBodyNode", {
	      tagName: "body",
	      nodes: []
	    });
	    //parser end
	 model.dataType({
		 name:"RoleMember",
		 properties:{
			 id:{},
			 roleId:{},
			 type:{},
			 username:{},
			 name:{},
			 deptId:{},
			 positionId:{},
			 createDate:{},
			 granted:{
				 dataType:'boolean'
			 }
		 }
	 });
	 model.dataType({
		 name:"Url",
		 properties:{
			 id:{},
			 name:{},
			 desc:{},
			 url:{},
			 forNavigation:{},
			 companyId:{},
			 icon:{},
			 order:{},
			 parentId:{},
			 use:{
				 dataType:'boolean'
			 },
			 children1:{
				 dataType:'Url',
				 provider: {
			        url:"./service/frame/url/company/role/?parentId={{@id}}",	
			        beforeSend: function(self, arg) {
			        	var currentRole=arg.model.get('currentRole');
			        	var roleId=currentRole.get("id");
			        	arg.options.data.roleId=roleId;
			        }
				 }
			 }
		 }
	 });
	 model.dataType({
		 name:"Dept",
		 properties:{
			 id:{},
			 name:{},
			 parentId:{},
			 use:{
				 dataType:'boolean'
			 },
			 children1:{
				 dataType:'Dept',
				 provider: {
			        url:"./service/frame/dept/company/role/?parentId={{@id}}",	
			        beforeSend: function(self, arg) {
			        	var currentRole=arg.model.get('currentRole');
			        	var roleId=currentRole.get("id");
			        	var companyId=currentRole.get("companyId");
			        	arg.options.data.companyId=companyId;
			        	arg.options.data.roleId=roleId;
			        }
				 }
			 }
		 }
	 });
	 model.dataType({
		 name:"Role",
		 properties:{
			 id: {},
	         name: {
	        	 validators: ["required"]
	         },
	         desc:{},
	         type:{
	        	 defaultValue:"normal"
	         },
	         companyId:{
	         },createDate:{
	             dataType: "date"
	         }
	         ,createUser:{},
	         enabled:{
	             dataType: "boolean",
	             defaultValue: true
	         },parentId:{},
	         users:{
	        	 dataType:'RoleMember',
				 provider: {
					 url:"./service/frame/role/members/",
				     pageSize: 10,
				     beforeSend: function(self, arg) {
				        	var data = arg.options.data;
				        	var currentRole=arg.model.get('currentRole');
				        	var roleId=currentRole.get("id");
				        	 data.roleId=roleId;
				        	 data.type='user';
				             return data;
				     }
				 }
	         },
	         usersForSelect:{
	        	 dataType:'RoleMember',
				 provider: {
				        url:"./service/frame/role/membersforselect/",	
				        pageSize: 10,
				        beforeSend: function(self, arg) {
				        	var currentRole=arg.model.get('currentRole');
				        	var roleId=currentRole.get("id");
				        	var companyId=currentRole.get("companyId");
				        	var data = arg.options.data;
				        	 data.roleId=roleId;
				        	 data.companyId=companyId;
				        	 data.type='user';
				             return data;
				        }	
			      }
	         },urls1:{
	        	 dataType:'Url',
				 provider: {
				        url:"./service/frame/url/company/role/",	
				        beforeSend: function(self, arg) {
				        	var currentRole=arg.model.get('currentRole');
				        	var roleId=currentRole.get("id");
				        	var companyId=currentRole.get("companyId");
				        	arg.options.data.roleId=roleId;
				        	arg.options.data.companyId=companyId;
				        	 //data.parentId=parentId;
				        	 //data.roleId=roleId;
				        	 //data.companyId=companyId;
				             //return data;
				        }	
			      }
	         },depts:{
	        	 dataType:'Dept',
	        	 provider: {
	        		  url:"./service/frame/dept/company/role/",	
				      beforeSend: function(self, arg) {
			        	var currentRole=arg.model.get('currentRole');
			        	var roleId=currentRole.get("id");
			        	var companyId=currentRole.get("companyId");
			        	arg.options.data.companyId=companyId;
			        	arg.options.data.roleId=roleId;
				      }
			      }
	         }
		 }
	 });
	 model.dataType({
	      name: "Company",
	      properties: {
	    	  id: {},
	          name: {},
	          fullName: {},
	          children: {
		        dataType: "Company",
			    provider: "./service/frame/company/tree/?parentId={{@id}}"
	          }/*,
	          roles:{
	        	  dataType: "Role",
	        	  provider: {
				        url:"./service/frame/role/page/?companyId={{@id}}",	
				        pageSize: 10,
				        beforeSend: function(self, arg) {
				        	 data = arg.options.data;
				             return data;
				        }	
			      }
	          }*/
	      }
	    });
	 model.describe("companys", {
	      dataType: "Company",
	      provider: "./service/frame/company/tree/"
	 });
	 model.describe("roles", {
		 dataType: "Role",
		 provider: {
			 url: "./service/frame/role/page/",
			 pageSize: 10,
			 parameter: {
				 companyId: "{{companyId}}"
			 },
			 beforeSend: function(self, arg) {
				 data = arg.options.data;
				 return data;
			 }
		 }
	 });
	 model.describe("editItem", {
	      dataType: "Role"
	 });
	 model.action({
      add: function() {
        model.set("editItem", {});
        return cola.widget("editLayer").show();
      },
      edit: function(item) {
        model.set("editItem", item.toJSON());
        return cola.widget("editLayer").show();
      },
      cancel: function() {
        return cola.widget("editLayer").hide();
      },
      ok: function() {
        var data, editItem, id, validate;
        editItem = model.get("editItem");
        validate = editItem.validate();
        if (validate) {
          id = editItem.get("id");
          data = editItem.toJSON();
          data.companyId=model.get("currentCompany.id");
          var type=data.id?"PUT":"POST";
          if(type==="PUT"){
        	  delete data.urls;
        	  delete data.urlComponents;
        	  delete data.roleMembers;
        	  delete data.children;
        	  delete data.authority;
          }
          NProgress.start();
          return $.ajax("./service/frame/role/", {
            data: JSON.stringify(data),
            type: data.id ? "PUT" : "POST",
    		contentType: "application/json",
            dataType:'text',		
            success:function(roleId) {
	           model.flush("roles");
	           notifySucessMsg();
            },
            complete: function(data) {
              cola.widget("editLayer").hide();
              return NProgress.done();
            }
          });
        }
      },
      del: function(item) {
    	  cola.confirm("您确定要删除当前记录吗？",{
    		  onApprove:function(){
    			  NProgress.start();
    			  var id=item.get('id');
    			  return $.ajax("./service/frame/role/"+id+"/", {
    				  type: "DELETE",
    				  success: function() {
    		              var curComp=model.get("currentCompany");
    		              if(curComp){
    		            	  curComp.reset("roles");
    		            	  model.flush("roles");
    		            	  notifySucessMsg();
    		              }
    					  return NProgress.done();
    				  }
    			  });
    		  }
    	  });
      },
      membersManage: function() {
    	  var currentRole=model.get("roles").current;
    	  if(currentRole){
    		  model.set("currentRole",currentRole);
    		  //currentRole.reset('users');
    		  return cola.widget("membersLayer").show();
    	  }
      },
      membersManageCancel: function() {
          return cola.widget("membersLayer").hide();
      },
      resourcesManage: function() {
    	  var currentRole=model.get("roles").current;
    	  if(currentRole){
    		  model.set("currentRole",currentRole);
    	  	  //currentRole.reset("urls");
    		  //cola.widget("urlsTree").refresh();
          	  return cola.widget("resourcesLayer").show();
          }
      }, 
      resourcesManageCancel: function() {
          return cola.widget("resourcesLayer").hide();
      },addUser:function(){
    	  model.get("currentRole").reset("usersForSelect");
          return cola.widget("usersForSelectLayer").show();
      },usersForSelectSave:function(){
          var users=editItem = model.get("currentRole").get("usersForSelect");
          var memberIds=[];
          if(!users){
        	  return;
          }
          users.each(function(user){
        	  if(user.get("selected")){
        		  memberIds.push(user.get("username"));
        	  }
          });
          var roleId=editItem = model.get("currentRole").get("id");
          if (memberIds.length>0) {
            var data={};
        	  data.roleId=roleId;
        	  data.type='user';
        	  data.memberIds=memberIds;
            NProgress.start();
            return $.ajax("./service/frame/role/members/", {
              data: JSON.stringify(data),
              type: "POST",
              contentType: "application/json",
              dataType:'text',
              success:function() {
            	  model.get("currentRole").reset("users");
            	  notifySucessMsg();
              },
              complete: function(data) {
                cola.widget("usersForSelectLayer").hide();
                return NProgress.done();
              }
            });
          }
      },delMember: function(item) {
    	  cola.confirm("您确定要移除当前角色成员吗？",{
    		  onApprove:function(){
    			  NProgress.start();
    			  var id=item.get('id');
    			  var memberIds=[];
    			  memberIds.push(id);
    			  var data={};
    			  data.memberIds=memberIds;
    			  return $.ajax("./service/frame/role/members/", {
    	              data: JSON.stringify(data),
    	              contentType: "application/json",
    				  type: "DELETE",
    				  success: function() {
    	            	  model.get("currentRole").reset("users");
    	            	  notifySucessMsg();
    					  return NProgress.done();
    				  }
    			  });
    		  }
    	  });
      },usersForSelectCancel:function(){
    	  
      },usersForSelectBack:function(){
          return cola.widget("usersForSelectLayer").hide();
      },saveRoleUrls:function(){
    	  cola.confirm("您确定要修改角色资源吗？",{
    		  onApprove:function(){
    			  NProgress.start();
            	  var roleId=model.get("currentRole.id");
    			  var urlIds=[];
    			  var delUrlIds = [];
    			  var data={};
    			  data.roleId=roleId;
    			  var urlsTree = cola.widget("urlsTree");
    			  var nodes=urlsTree.getItems();
    			  getSelectNodes(nodes,urlIds,delUrlIds);
    			  data.urlIds=urlIds;
    			  data.delUrlIds = delUrlIds;
    			  return $.ajax("./service/frame/role/urls/", {
    	              data: JSON.stringify(data),
    	              contentType: "application/json",
    				  type: "POST",
    				  beforeSend: function() {
    					cola.widget("saveRoleUrlsButton").set("disabled",true);  
    					cola.widget("saveRoleUrlsButton").addClass("loading");
    				  },
    				  success: function() {
    					  cola.widget("saveRoleUrlsButton").set("disabled",false); 
    					  cola.widget("saveRoleUrlsButton").removeClass("loading");
    	            	  //model.get("currentRole").reset("urls1");
    					  notifySucessMsg();
    				  },complete:function(){
    					  return NProgress.done();
    				  }
    			  });
    		  }
    	  });
      },saveRoleDepts:function(){
    	  cola.confirm("您确定要修改角色成员(部门)吗？",{
    		  onApprove:function(){
    			  NProgress.start();
            	  var roleId=model.get("currentRole.id");
    			  var ids=[];
    			  var data={};
    			  data.type="dept";
    			  data.roleId=roleId;
    			  var deptsTree = cola.widget("deptsTree");
    			  var nodes=deptsTree.getItems();
    			  getSelectNodes(nodes,ids);
    			  data.memberIds=ids;
    			  return $.ajax("./service/frame/role/members/", {
    	              data: JSON.stringify(data),
    	              contentType: "application/json",
    				  type: "POST",
    				  success: function() {
    	            	  //model.get("currentRole").reset("depts");
    					  notifySucessMsg();
    				  },complete:function(){
    					  return NProgress.done();
    				  }
    			  });
    		  }
    	  });
      },refreshUrlAuthCache:function(){
    	  cola.confirm("您确定要更新权限缓存吗？",{
    		  onApprove:function(){
    			  var url="./service/frame/role/refresh/"+new Date().getTime()+"/";
    			  return $.ajax(url, {
    				  type: "GET",
    				  success: function() {
    					  notifySucessMsg();
    				  }
    			  });
    			 }
    	  });
      },switchPageDomTreeView: function(self, arg) {
          var body, findComponent, handler, index, mapping, nodeList;
          index = parseInt(self.get("userData"));
//          nodeList = model.get("pageNodeList");
//          body = model.get("pageBodyNode");
//          if (index) {
//            handler = function(el) {
//              var id;
//              id = el.get("id");
//              return nodeList.each(function(n) {
//                if (n.get("id") === id) {
//                  n.set("visible", el.get("visible"));
//                  n.set("editable", el.get("editable"));
//                  return false;
//                }
//              });
//            };
//            findComponent = function(el) {
//              var id, ref;
//              id = el.get("id");
//              if (id) {
//                handler(el);
//              }
//              return (ref = el.get("nodes")) != null ? ref.each(findComponent) : void 0;
//            };
//            body.get("nodes").each(findComponent);
//          } else {
//            mapping = {};
//            findComponent = function(n) {
//              var id;
//              id = n.get("id");
//              if (id) {
//                mapping[id] = n;
//              }
//              return n.get("nodes").each(findComponent);
//            };
//            body.get("nodes").each(findComponent);
//            nodeList.each(function(el) {
//              var id, target;
//              id = el.get("id");
//              target = mapping[id];
//              if (target) {
//                target.set("visible", el.get("visible"));
//                return target.set("editable", el.get("editable"));
//              }
//            });
//          }
          cola.widget("cardBookDataView").setCurrentIndex(index);
        },
        saveRoleComponents: function() {
          var urlAuth=model.get("currentRoleUrl.use");
          if(!urlAuth){
        	  return;
          }
          var body, childNode, i, index, item, j, len, len1, list, pushElement, recursiveMakeList, ref, ref1;
          index = cola.widget("cardBookDataView").get('currentIndex');
          list = [];
          pushElement = function(el) {
            return list.push({
              id: el.id,
              visible: el.visible,
              editable: el.editable
            });
          };
          if (index === 0) {
            body = model.get("pageBodyNode").toJSON();
            recursiveMakeList = function(el) {
              var childNode, i, len, ref, results;
              if (el.id) {
                pushElement(el);
              }
              ref = el.nodes;
              results = [];
              for (i = 0, len = ref.length; i < len; i++) {
                childNode = ref[i];
                results.push(recursiveMakeList(childNode));
              }
              return results;
            };
            ref = body.nodes;
            for (i = 0, len = ref.length; i < len; i++) {
              childNode = ref[i];
              recursiveMakeList(childNode);
            }
          } else {
            ref1 = model.get("pageNodeList").toJSON();
            for (j = 0, len1 = ref1.length; j < len1; j++) {
              item = ref1[j];
              pushElement(item);
            }
          }
          var data={
        		  roleId:model.get('currentRole.id'),
        		  urlId:model.get('currentRoleUrl.id'),
        		  ucComps:list
          };
          return $.ajax("./service/frame/role/urlcomps/", {
              data: JSON.stringify(data),
              contentType: "application/json",
			  type: "POST",
			  beforeSend: function(self,arg) {
				  cola.widget("saveRoleComponentsButton").set("disabled",true);
				  cola.widget("saveRoleComponentsButton").addClass("loading");
			  },
			  success:function(){
				  cola.widget("saveRoleComponentsButton").set("disabled",false);
				  cola.widget("saveRoleComponentsButton").removeClass("loading");
				  notifySucessMsg();
			  },
			  complete: function() {
				  return NProgress.done();
			  }
		  });
        },
        getNodeName: function(node) {
          var comment, id, nodeName, tagName;
          id = node.get("id");
          tagName = node.get("tagName");
          comment = node.get("comment");
          nodeName = "";
          if (comment) {
            nodeName += comment;
          } else {
        	  if (id) {
	              nodeName = tagName + "#" + id;
	          } else {
	              nodeName = tagName;
	          }
          }
          return nodeName;
        },
        // 全选只读
        selectAllVisible: function() {
        	if (model.get("pageNodeList")) {
        		model.get("pageNodeList").each(function(pageNode){
        			if (pageNode.get("visible")==false) {
        				pageNode.set("visible",true);
        			}
        		});
        	};
        },
        // 全选可操作
        selectAllEditable: function() {
        	if (model.get("pageNodeList")) {
        		model.get("pageNodeList").each(function(pageNode){
        			if (pageNode.get("editable")==false) {
        				pageNode.set("editable",true);
        			}
        		});
        	};
        },
        // 清空为未选
        resetFalse: function() {
        	if (this.get("value")) {
        		if (model.get("pageNodeList")) {
            		model.get("pageNodeList").each(function(pageNode){
            			if (pageNode.get("visible")==true) {
            				pageNode.set("visible",false);
            			}
            			if (pageNode.get("editable")==true) {
            				pageNode.set("editable",false);
            			}
            		});
            	};
        	}
        }
    });
	 function notifySucessMsg(){
		 cola.NotifyTipManager.success({
				message: "操作成功",
				description: "后台任务执行成功！",
				showDuration: 1000
		  });
	 }
    function getSelectNodes(nodes,urlIds,delUrlIds){
		$.each(nodes,function(){
			var node=this;
			var checked=node.get('checked');
			if(undefined==checked||checked){
				urlIds.push(node.get('data.id'));
			}
			if(!checked){
				delUrlIds.push(node.get('data.id'));
			}
			
			var children=node.get('children');
			if(children){
				getSelectNodes(children,urlIds,delUrlIds);
			}
		});
    }
    return model.widgetConfig({
    	companysTree: {
  			$type: "tree",
  			autoCollapse: false,
  			autoExpand: true,
  			highlightCurrentItem: true,
  			currentItemAlias:"currentCompany",
  			changeCurrentItem:true,
  			bind: {
  				expandedProperty: "expanded",
  				textProperty: "name",
  				expression: "node in companys",
                child: {
	  				recursive: true,
                    expression: "node in node.children"
                }
  			},
	  		currentNodeChange: function (self, arg) {
				var current = self.get("currentNode");
				if (current) {
					var currentCompany = current.get("data");
                    model.set("companyId", currentCompany.get("id"));
                    if (model._tableFlushTimmer) {
                        clearTimeout(model._tableFlushTimmer);
                    }
                    model._tableFlushTimmer = setTimeout(function () {
                        model.flush("roles"); 
                    }, 100);
				}
/*				var currentCompany= current ? current.get("data"):null;
				if(currentCompany){
					var currentRoles=currentCompany.get("roles");
					if(!currentRoles){
						currentRoles=[];
					}
					currentCompany.roles=currentRoles;
	  				//model.set("currentCompany",currentCompany);
				}*/
	  		}
  		},
  		urlsTree:{
  			$type:"tree",
  			autoCollapse:false,
  			autoExpand:false,
  			height:"100%",
  			highlightCurrentItem:true,
  			changeCurrentItem:true,
  			bind:{
  				//expandedProperty: "expanded",
  				textProperty:"name",
				checkedProperty: "use",
  				expression:"node in currentRole.urls1",
  				child:{
  	  				textProperty:"name",
  	  				checkedProperty: "use",
  					recursive: true,
                    expression: "node in node.children1"
  				}
  			},
	  		currentNodeChange: function (self, arg) {
				var current = self.get("currentNode");
				var currentUrl= current ? current.get("data"):null;
				if(currentUrl){
					var children1=currentUrl.get("children1");
					if(!children1){
						children1=[];
					}
					currentUrl.children1=children1;
					model.set("currentRoleUrl",currentUrl);
				}
	  		},
            itemClick: function(self, arg) {
            	var use=arg.item.get('data.use');
            	var url=arg.item.get('data.url');
            	if(use&&url){
            		showPageDomTree(url);
            	}else{
            	    model.set("pageNodeList", []);
            	    model.set("pageBodyNode", {
            	      tagName: "body",
            	      nodes: []
            	    });
            	}
            }
  		},
  		deptsTree:{
  			$type:"tree",
  			autoCollapse:false,
  			autoExpand:false,
  			height:"500",
  			highlightCurrentItem:true,
  			changeCurrentItem:true,
  			bind:{
  				//expandedProperty: "expanded",
  				textProperty:"name",
				checkedProperty: "use",
  				expression:"node in currentRole.depts",
  				child:{
  	  				textProperty:"name",
  	  				checkedProperty: "use",
  					recursive: true,
                    expression: "node in node.children1"
  				}
  			},
	  		currentNodeChange: function (self, arg) {
				var current = self.get("currentNode");
				var currentDept= current ? current.get("data"):null;
				if(currentDept){
					var children1=currentDept.get("children1");
					if(!children1){
						children1=[];
					}
					currentDept.children1=children1;
					model.set("currentRoleDept",currentDept);
				}
	  		}
  		},
        rolesPager: {
            $type: "pager",
            bind: "roles"
        },
        roleTable: {
          $type: "table",
          bind: "item in roles",
          showHeader: true,
          height: "100%",
          columns: [
            {
              $type: "select"
            }, {
              caption: "角色名称",
              bind: ".name"
            }, {
              caption: "描述",
              bind: ".desc",
              align: "center"
            }, {
                caption: "操作",
                align: "center",
                template: "operations"
              }
          ],
          currentPageOnly: true,
          autoLoadPage: false,
          changeCurrentItem: true,
          highlightCurrentItem: true
        },
      radioGroup: {
        items: [
          {
            value: true,
            label: "男"
          }, {
            value: false,
            label: "女"
          }
        ]
      },
      editLayer: {
    	$type : "Sidebar",
		size:"280",
		direction : "right",
        onShow: function() {
          return $("#mainView").hide();
        },
        beforeHide: function() {
          return $("#mainView").show();
        }
      },
      membersLayer: {
    	  $type : "Sidebar",
  		  size:"950",
  		  direction : "right",
          onShow: function() {
            return $("#mainView").hide();
          },
          beforeHide: function() {
            return $("#mainView").show();
          }
        },
        resourcesLayer:{
        	  $type : "Sidebar",
    		  size:"950",
    		  direction : "right",
              onShow: function() {
                return $("#mainView").hide();
              },
              beforeHide: function() {
                return $("#mainView").show();
              }
        },
        usersPager:{
        	 $type: "pager",
             bind: "currentRole.users"
        },
        usersTable:{
        	$type: "table",
            bind: "itemUser in currentRole.users",
            showHeader: true,
            height: "100%",
            columns: [
              {
                $type: "select"
              }, {
                caption: "用户名",
                bind: ".username"
              }, {
                caption: "名称",
                bind: ".user.cname",
                align: "center"
              }, {
                  caption: "操作",
                  align: "center",
                  template: "operations"
              }
            ],
            currentPageOnly: true,
            autoLoadPage: false,
            changeCurrentItem: true,
            highlightCurrentItem: true
        },
        usersForSelectLayer:{
        	  $type : "Sidebar",
    		  size:"350",
    		  direction : "right",
              onShow: function() {
                return $("#mainView").hide();
              },
              beforeHide: function() {
                return $("#mainView").show();
              }
        },
        usersForSelectPager:{
       	 	$type: "pager",
            bind: "currentRole.usersForSelect"
        },
        usersForSelectTable:{
        	$type: "table",
            bind: "item in currentRole.usersForSelect",
            showHeader: true,
            columns: [
              {
                $type: "select"
              }, {
                caption: "用户名",
                bind: ".username"
              }, {
                caption: "名称",
                bind: ".id",
                align: "center"
              }
            ],
            currentPageOnly: true,
            autoLoadPage: false,
            changeCurrentItem: true,
            highlightCurrentItem: true
        },domTree: {
            $type: "Tree",
            height: 400,
            autoCollapse: false,
            autoExpand: true,
            highlightCurrentItem: true,
            bind: {
              expression: "node in pageBodyNode.nodes",
              child:{
	  				textProperty:"id",
					recursive: true,
					expression: "node in node.nodes"
              }
            },
            itemClick: function(self, arg) {
              self.get$Dom().find(".current-node").removeClass("current-node");
              return $(arg.dom).addClass("current-node");
            }
          },
          domList: {
            $type: "listView",
            bind: "node in pageNodeList",
            textProperty: "id",
            height:"400px",
            highlightCurrentItem: true
          },
          authRadioGroup1:{
        	  items:['无权限','只读','可操作']
          },
          authRadioGroup2:{
        	  items:['无权限','只读','可操作']
          }
    });
  });
}).call(this);
