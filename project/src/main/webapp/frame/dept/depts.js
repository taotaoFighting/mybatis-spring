(function() {
	cola(function(model) {
		$(".ui.accordion").accordion({
			exclusive : false
		});
		model.dataType({
					name : "Node",
					properties : {
						createDate : {
							dataType : "date"
						},
						name : {
							validators : [ "required", {
								$type : "length",
								min : 0,
								max : 30
							} ]
						},
						desc : {
							validators : [ {
								$type : "length",
								min : 0,
								max : 60
							} ]
						},
						nodes : {
							dataType : "Node",
							provider : {
								url : "./service/frame/dept/company/parent/?parentId={{@id}}"
							}
						}
					}
				});

		model.set("companyId", App.getLoginUser().companyId);
		model.describe("nodes", {
			dataType : "Node",
			provider : {
				url : "./service/frame/dept/company/parent/",
				beforeSend : function(self, arg) {
					arg.options.data.companyId = arg.model.get("companyId");
					arg.options.data.parentId = arg.model.get("parentId");
					cola.widget("SystemDropDown").set("value",
							App.getLoginUser().companyName);
				}
			}

		});

		model.dataType({
			name : "CapCompanyInfo",
			properties : {
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
			old = model.get("currentEditItem");
			old && old.remove(true);
			model.set("currentEditItem", entity.toJSON({
				simpleValue : true
			}));
			newEntity = model.get("currentEditItem");
			newEntity.setState(entity.state);
			newEntity.validate();
		}
		model.describe("currentEditItem", "Node");
		model.set("currentEditItem", {});
		model
				.action({
					// 添加根节点
					addrootnode : function() {
						var nodes = model.get("nodes");
						var entity = nodes.insert({
							name : "<新部门>",
							companyId : model.get("companyId")
						});
						var tree = cola.widget("deptTree");
						var currentNode = tree.findNode(entity);
						tree.expand(currentNode);
						tree.set("currentItem", entity);
						event && event.stopPropagation();
					},
					add : function() {
						
						var tree = cola.widget("deptTree");
						var currentNode = tree.get("currentNode");
						var nodeEntity = currentNode.get("data");
						if (nodeEntity.state == "new") {
							cola.NotifyTipManager.error({
								message : "添加失败",
								description : "您添加的节点未保存，请先保存再添加子节点！",
								showDuration : 1000
							})
						} else {
							var nodes = nodeEntity.get("nodes", "sync");
							if (!nodes) {
								nodeEntity.set("nodes", []);
								nodes = nodeEntity.get("nodes")
							}
							
							var dd = model.get("companyId");
							var entity = nodes.insert({
								name : "<新部门>",
								parentId : nodeEntity.get("id"),
								companyId:model.get("companyId")
								
							});
							tree.expand(currentNode);
							tree.set("currentItem", entity);
							event && event.stopPropagation();
						}
					},
					remove : function(node) {

						var currentEditItem = model.get("currentEditItem");
						var nodes = currentEditItem.get("nodes", "sync");
						cola
								.confirm(
										"您确定要删除当前记录吗？",
										{
											onApprove : function() {
												if (nodes
														&& nodes.entityCount > 0) {
													cola.alert("存在子部门，不可删除！");
												} else {
													if (!model.get(
															"currentEditItem")
															.get("id")) {
														node.remove();
														cola.NotifyTipManager
																.success({
																	message : "删除成功",
																	description : "后台任务执行成功！",
																	showDuration : 1000
																})
													} else {
														$
																.ajax(
																		"./service/frame/dept/"
																				+ model
																						.get(
																								"currentEditItem")
																						.get(
																								"id")
																				+ "/",
																		{
																			type : "DELETE",
																			success : function(
																					arg,
																					self) {
																				node
																						.remove();
																				cola.NotifyTipManager
																						.success({
																							message : "删除成功",
																							description : "后台任务执行成功！",
																							showDuration : 1000
																						})
																			}
																		});
													}
												}
											}
										});
					},
					deptAddEdit : function(currentEditItem) {
						
						var data;
						var validate = currentEditItem.validate();
						if (validate) {
							if (currentEditItem.state != "none") {
								data = currentEditItem.toJSON();
								
								delete data.nodes;
								NProgress.start();
								return $
										.ajax(
												"./service/frame/dept/",
												{
													data : JSON.stringify(data),
													type : currentEditItem.state != "new" ? "PUT"
															: "POST",
													async : true,
													contentType : "application/json",
													complete : function(arg,
															self) {
														var currentEditItem = model
																.get("currentEditItem");
														var currentNode = cola
																.widget(
																		"deptTree")
																.get(
																		"currentNode");
														var entity = currentNode
																.get("data");
														if (currentEditItem.state == "new") {
															entity.set("id",arg.responseText);
															cola.NotifyTipManager
																	.success({
																		message : "添加成功",
																		description : "后台任务执行成功！",
																		showDuration : 1000
																	})
														} else if (currentEditItem.state == "modified") {
															cola.NotifyTipManager
																	.success({
																		message : "修改成功",
																		description : "后台任务执行成功！",
																		showDuration : 1000
																	})
														}
														entity
																.set(currentEditItem
																		.toJSON({
																			simpleValue : true
																		}));
														entity.setState("none");
														copyNodeDataToEdit(entity);
														return NProgress.done();
													}
												});
							}
						}

					}

				});

		model
				.widgetConfig({
					editForm : {
						$type : "form",
						bind : "currentEditItem"
					},
					SystemDropDown : {
						$type : "customDropdown",
						openMode : "drop",
						valueProperty : "name",
						textProperty : "name",
						content : {
							$type : "tree",
							bind : {
								hasChildProperty : "isDir",
								expression : "capcompanyinfo in capcompanyinfos",
								textProperty : "name",
								child : {
									recursive : true,
									hasChildProperty : "isDir",
									textProperty : "name",
									expression : "capcompanyinfo in capcompanyinfo.capcompanyinfos"
								}
							},
							itemClick : function(self, arg) {
								
								var companyId = arg.item._data._data.id;
								model.set("companyId", companyId);
								var tree = cola.widget("deptTree");
								tree.refresh();
								var nodes = model.get("nodes");
								model.flush("nodes");
								var dropdown = cola.findDropDown(self);
								if (dropdown)
									dropdown.close(arg.item.get("data"));
							}
						}
					},

					deptTree : {
						$type : "tree",
						lazyRenderChildNodes : false,
						bind : {
							hasChildProperty : "isDir",
							expression : "node in nodes",
							child : {
								recursive : true,

								hasChildProperty : "isDir",
								expression : "node in node.nodes",
							}
						},
						highlightCurrentItem : true,
						autoExpand : true,
						autoCollapse : true,
						currentNodeChange : function(self, arg) {
							var current = self.get("currentNode");
							if (current) {
								var entity = current.get("data");
								copyNodeDataToEdit(entity);
							}

						}

					}
				});
		return window.cModel = model;
	});
}).call(this);
