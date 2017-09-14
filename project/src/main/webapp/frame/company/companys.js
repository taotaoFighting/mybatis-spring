(function() {
	cola(function(model) {
		$(".ui.accordion").accordion({
			exclusive : false
		});

		
		model.set("arrycompTypes", [ {
			value : "银行",
			key : "B"// 银行原key值0
		}, {
			value : "外包公司",
			key : "O"// 外包公司原key值1
		}, {
			value : "管理公司",
			key : "M"// 管理公司原key值2
		} ]);

		model.set("arrycaseTypes", [ {
			value : "客户",
			key : "CUST"
		}, {
			value : "账户",
			key : "ACC"
		} ]);
		

		model.describe("capCompAreas", {
			provider : {
				url:"./service/capCompArea/citylist",
				pageSize : 20,
				beforeSend : function(self, arg) {								
					arg.options.data.compCode=model.get("compId");
				},
				complete : function(self, arg) {
					//计算委外城市数目
					if (arg.model.data._rootData._data.capCompAreas!=null) {
						var totalEntityCount=arg.model.data._rootData._data.capCompAreas.totalEntityCount;
						model.set("customCapCompanyInfo.city",totalEntityCount);
					}
				}
			}
		});
		
		model.set("categoryCode", "bizType");
		model.describe("bizTypes", {
			provider : {
				url : "./service/selectCapDictItem/" + model.get("categoryCode") + "/"
			}
		});
		model.get("bizTypes");

		model.describe("dictregCurrencys", {
			provider : {
				url : "./service/selectCapDictItem/currencyType/"
			}
		});
		model.get("dictregCurrencys");

		model.dataType({
			name : "Node",
			properties : {
				nodes : {
					dataType : "Node",
					provider : {
						url : "./service/capArea/checked/{{@id}}/",
						beforeSend : function(self, arg) {
							arg.options.data.compCode = model.get("compId");
						}
					}
				}
			}
		});

		model.set("parentId", "-1");
		model.describe("nodes", {
			dataType : "Node",
			provider : {
				url : "./service/capArea/checked/" + model.get("parentId") + "/",
				beforeSend : function(self, arg) {
					arg.options.data.compCode = model.get("compId");
				}
			}

		});
		model.dataType({
			name : "CapCompanyInfo",
			properties : {
				fullName : {
					validators : [ "required" ]
				},
				regInst : {
					validators : [ "required" ]
				},
				regId : {
					validators : [ "required" ]
				},
				startDate : {
					validators : [ "required" ]
				},
				endDate : {
					validators : [ "required" ]
				},
				compType : {
					validators : [ "required" ]
				},
				regCapital : {
					validators : [ "required" ]
				},
				regCurrency : {
					validators : [ "required" ]
				},
				contactor : {
					validators : [ "required" ]
				},
				workTel : {
					validators : [ "required" ]
				},
				bankCode:{
					validators : [{
						$type : "length",
						min:0,
						max : 4
					}]
				},
				capcompanyinfos : {
					dataType : "CapCompanyInfo",
					provider : {
						url : "./service/frame/company/tree/?parentId={{@id}}"
					}
				}
			}
		});
		model.describe("capcompanyinfos", {
			dataType : "CapCompanyInfo",
			provider : {
				url : "./service/frame/company/tree/"
			}
		});
		
		function copyNodeDataToEdit(entity) {
			old = model.get("customCapCompanyInfo");
			old && old.remove(true);
			model.set("customCapCompanyInfo", entity.toJSON({
				simpleValue : true
			}));
			newEntity = model.get("customCapCompanyInfo");
			newEntity.setState(entity.state);
			newEntity.validate();
		}
		model.describe("customCapCompanyInfo", "CapCompanyInfo");
		model.set("customCapCompanyInfo", {});
		
		model.action({
			// 删除委外城市capCompArea
			removecity : function(capCompArea) {
				cola.confirm("您确定要删除当前记录吗？",{
					onApprove : function() {
						return $.ajax("./service/capCompArea/delete/"+ capCompArea._data.id+ "/",
							{
								type : "DELETE",
								complete : function() {
										model.flush("capCompAreas");
										cola.NotifyTipManager.success({
											message : "删除成功",
											description : "后台任务执行成功！",
											showDuration : 1000
										});
											capCompArea.remove();
								}
							});
						}
					});
					},
					// 新增委外城市
					addcity : function() {
						cola.widget("addcitySidebar").show();
					},
					// 删除树节点
					remove : function(capcompanyinfo) {
						event && event.stopPropagation();
						var customCapCompanyInfo = model.get("customCapCompanyInfo");
						var capcompanyinfos = customCapCompanyInfo.get("capcompanyinfos", "sync");
						if (capcompanyinfos && capcompanyinfos.entityCount > 0) {
							cola.alert("该节点下有子节点不能删除");
							return false;
						}
						cola.confirm("您确定要删除当前节点吗？", {
							onApprove : function() {
								return $.ajax("./service/frame/company/"
										+ capcompanyinfo._data.id + "/", {
									type : "DELETE",
									complete : function(arg,self) {
										var successed = arg.responseText;
										if(successed){
										cola.NotifyTipManager.success({
											message : "删除成功",
											description : "后台任务执行成功！",
											showDuration : 1000
										});
										capcompanyinfo.remove();
										}else{
											cola.NotifyTipManager.error({
												message : "删除失败，该公司下存在用户",
												description : "后台任务执行成功！",
												showDuration : 1000
											});
										}
									}
								});
							}
						});
					},
					// 添加根节点
					addrootnode : function() {
						var capcompanyinfos = model.get("capcompanyinfos");
						var entity = capcompanyinfos.insert({
							name : "<新公司>"
						});
						var tree = cola.widget("fileTree");
						var currentNode = tree.findNode(entity);
						tree.expand(currentNode);
						tree.set("currentItem", entity);
						event && event.stopPropagation();
					},
					// 新增子节点
					add : function() {
						var tree = cola.widget("fileTree");
						var currentNode = tree.get("currentNode");
						var nodeEntity = currentNode.get("data");

						if (nodeEntity.state == "new") {
							cola.NotifyTipManager.error({
								message : "添加失败",
								description : "您添加的节点未保存，请先保存再添加子节点！",
								showDuration : 1000
							});
						} else {
							var capcompanyinfos = nodeEntity.get("capcompanyinfos", "sync");
							if (!capcompanyinfos) {
								nodeEntity.set("capcompanyinfos", []);
								capcompanyinfos = nodeEntity.get("capcompanyinfos");
							}
							var entity = capcompanyinfos.insert({
								name : "<新公司>",
								compParent : nodeEntity.get("id")
							});
							tree.expand(currentNode);
							tree.set("currentItem", entity);
							event && event.stopPropagation();
						}
					},
					autoConfig: function(customCapCompanyInfo) {
						debugger;
						if (!customCapCompanyInfo.get("id")) {
							cola.NotifyTipManager.info({
								message: "消息提示",
								description: "您好,请先保存!",
								showDuration: 3000
							});
							return false;
						} else {
							if (customCapCompanyInfo.get("compType")!="O") {
								cola.NotifyTipManager.info({
									message: "消息提示",
									description: "您好,目前只支持催收公司的自动配置!",
									showDuration: 3000
								});
								return false;
							}
							$.ajax("./service/capCompanyInfo/autoConfig/",{
								type: "POST",
								data: JSON.stringify(customCapCompanyInfo.toJSON()),
								contentType: "application/json;charset=utf-8",
								success: function(self, arg) {
									cola.NotifyTipManager.success({
										message: "消息提示",
										description: "后台任务执行成功!",
										showDuration: 3000
									});
								},
								error: function() {
									cola.NotifyTipManager.error({
										message: "消息提示",
										description: "后台任务执行失败,请联系管理员!",
										showDuration: 3000
									});
								}
							});
						}
					},
					// 新增修改提交的方法
					capcompanyinfoSave : function(customCapCompanyInfo) {
						var data, result;
						var CapCompanyInfo = customCapCompanyInfo;
						result = CapCompanyInfo.validate();
						CapCompanyInfo.set("instCode",CapCompanyInfo._data.bankCode);
						if (CapCompanyInfo._data.compType=="B") {
							CapCompanyInfo.set("orgCode",CapCompanyInfo._data.bankCode);
						}
						if (result) {
							if (CapCompanyInfo.state == "new") {
								CapCompanyInfo.set("createUser", App.getLoginUser().cname);
							} else if (CapCompanyInfo.state == "modified") {
								CapCompanyInfo.set("updateUser", App.getLoginUser().cname);
							}
							data = CapCompanyInfo.toJSON();
							delete data.capcompanyinfos;
							var isNew = CapCompanyInfo.state == "new";
									if(CapCompanyInfo.state!="none"){
										return $.ajax("./service/frame/company/", {
											data : JSON.stringify(data),
											type : CapCompanyInfo.state != "new" ? "PUT" : "POST",
											contentType : "application/json;charset=utf-8",
											complete : function(arg, self) {
												var customCapCompanyInfo = model.get("customCapCompanyInfo");
												var currentNode = cola.widget("fileTree").get("currentNode");
												var entity = currentNode.get("data");
												entity.set(customCapCompanyInfo.toJSON({
													simpleValue : true
												}));
												var flag=true;
												if (isNew) {
													entity.set("id", arg.responseJSON.id);
													 flag=arg.responseJSON.flag;
												}
											
												if(flag){
													cola.widget("orgCode").set("readOnly",true);
													entity.setState("none");
													cola.NotifyTipManager.success({
														message : "保存成功",
														description : "后台任务执行成功！",
														showDuration : 1000
													});
												}else{
													entity.setState("new");
													cola.NotifyTipManager.error({
														message : "保存失败,机构代码已经存在！",
														description : "后台任务执行成功！",
														showDuration : 1000
													});
												}
												copyNodeDataToEdit(entity);
											}
										});
									}
									else{
										cola.NotifyTipManager.success({
											message : "保存成功",
											description : "后台任务执行成功！",
											showDuration : 1000
										});
									}
						}
					},
					// 遍历整个树
					citySave : function() {
						var list = new Array();
						model.get("nodes").each(function(node) {
							model.action.iteratAreaTree(list, node);
						});
						// 遍历树函数执行完,执行下面函数
						model.action.citylist(list);					
						model.flush("capCompAreas");
						cola.widget("addcitySidebar").hide();
					},
					// 遍历所有被选中的数据存放在list集合中,再对其进行遍历保存到数据库中
					citylist : function(list) {					
						for (var i = 0; i < list.length; i++) {
							$.ajax("./service/capCompArea/save",
								{
									data : JSON.stringify(list[i]),
									type : "POST",
									contentType : "application/json"
							});							
						}
						
						cola.NotifyTipManager.success({
							message : "添加完成",
							description : "后台任务执行成功！",
							showDuration : 1000
						});
					},
					iteratAreaTree : function(list, node) {
						
						// 遍历树判断节点是否被选中
						if (node.get("checked")) {
							var areaCode = node.get("id");
							var compCode = model.get("customCapCompanyInfo")._data.id;
							var data = {
								areaCode : areaCode,
								compCode : compCode
							};
							// 每遍历一次,data存放在集合中
							list.push(data);
						}
						// 判断树节点不加载,去遍历子节点
						var nodes = node.get("nodes", "never");
						if (nodes) {
							nodes.each(function(node) {
								model.action.iteratAreaTree(list, node);
							});
						}
					}
				});

		model.widgetConfig({
					fileTree : {
						$type : "tree",
						bind : {
							expression : "capcompanyinfo in capcompanyinfos",
							child : {
								recursive : true,
								expression : "capcompanyinfo in capcompanyinfo.capcompanyinfos"
							}
						},
						highlightCurrentItem : true,
						autoExpand : true,
						autoCollapse : true,
						currentNodeChange : function(self, arg) {
							var current = self.get("currentNode");
							if (current._data._data.bizType==0) {
								model.get("customCapCompanyInfo").set("bizType", "0");
							}
							if (current._data.state!="new" || !current._data.state) {
								cola.widget("orgCode").set("readOnly",true);
								cola.widget("bankCode").set("readOnly",true);
								cola.widget("instCode").set("readOnly",true);
							}else {
								cola.widget("orgCode").set("readOnly",false);
								cola.widget("bankCode").set("readOnly",false);
								cola.widget("instCode").set("readOnly",true);							
							}
							model.set("compId", current._data._data.id);							
							if (model._tableFlushTimmer) {
		                        clearTimeout(model._tableFlushTimmer);
		                    }
		                    model._tableFlushTimmer = setTimeout(function () {		                    	
		                    	model.set("nodes",[]);
		                    	model.flush("nodes");
		                        model.flush("capCompAreas"); 
		                    }, 100);
							if (current) {
								var entity = current.get("data");
								copyNodeDataToEdit(entity);
							}
						}
					},
					areaTree : {
						$type : "tree",
						width : 350,
						highlightCurrentItem : true,
						autoExpand : true,
						autoCollapse : true,
						autoCheckChildren : true,
						bind : {
							expression : "node in nodes",
							checkedProperty : "checked",
							textProperty : "areaName",
							child : {
								expandedProperty : "expanded",
								recursive : true,
								expression : "node in node.nodes",
								checkedProperty : "checked",
								textProperty : "areaName"
							}
						}
					},
					bizTypeSelectDropDown : {
						$type : "dropdown",
						openMode : "drop",
						items : "{{bizType in bizTypes}}",
						valueProperty : "key",
						textProperty : "value",
						bind : "customCapCompanyInfo.bizType"
					},
					compTypedropdown : {
						$type : "dropdown",
						openMode : "drop",
						items : "{{arrycompType in arrycompTypes}}",
						valueProperty : "key",
						textProperty : "value",
						bind : "customCapCompanyInfo.compType",
						change : function(self, arg) {
							if (arg.value == "O" || arg.value == "M") {
								$("#bizTypeF").hide();
								$("#caseTypeF").hide();
								$("#bankCodeF").hide();
								$("#instCodeF").hide();
							} else {
								$("#bizTypeF").show();
								$("#caseTypeF").show();
								$("#bankCodeF").show();
								$("#instCodeF").show();
							}

							if (arg.value == "B" || arg.value == "M") {
								$("#cityF").hide();
								$("#addcityform").hide();
							} else {
								$("#cityF").show();
								$("#addcityform").show();
							}
							
							if (arg.value == "B") {
								$("#orgCodeF").hide();
							}else {
								$("#orgCodeF").show();
							}
						}
					},
					regCurrencydropdown : {
						$type : "dropdown",
						openMode : "drop",
						items : "{{dictregCurrency in dictregCurrencys}}",
						valueProperty : "key",
						textProperty : "value",
						bind : "customCapCompanyInfo.regCurrency"
					},
					caseTypeDropDown : {
						$type : "dropdown",
						openMode : "drop",
						items : "{{arrycaseType in arrycaseTypes}}",
						valueProperty : "key",
						textProperty : "value",
						bind : "customCapCompanyInfo.caseType"
					},
					addcitySidebar : {
						$type : "Sidebar",
						size : "350",
						direction : "right"
					},
					addMenuSidebar : {
						$type : "Sidebar",
						size : "350",
						direction : "right"
					},
					editForm:{
			    		$type:"form",
			    		bind:"customCapCompanyInfo"
			    	},
					cityList : {
						$type : "table",
						bind : "capCompArea in capCompAreas",
						showHeader : true,
						highlightCurrentItem : true,
						autoLoadPage:true,
						currentPageOnly: false,
						changeCurrentItem: true,
						columns : [ {
							bind : ".areaName",
							caption : "区域名称"
						}, {
							caption : "操作",
							template : "operation"
						} ]
					},
					// 菜单列表
					showMenuTable:{
			        	$type: "table",
			            bind: "item in urls",
			            selectedProperty: "__select",
			            showHeader: true,
			            currentPageOnly: true,
			            autoLoadPage: false,
			            changeCurrentItem: true,
			            highlightCurrentItem: true,
			            columns: [
			              {
			                $type: "select"
			              }, {
			                caption: "菜单名称",
			                bind: ".name"
			              }
			            ]
			        },
				});
		return window.cModel = model;
	});
}).call(this);
