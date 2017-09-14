/**
 * 
 */
package com.project.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.project.entity.Project;
import com.project.service.ProjectService;

/**
 * @author cleartor
 *
 * 2017Äê9ÔÂ13ÈÕ
 */
@Controller
public class TestController {
	
	@Autowired
	ProjectService projectService;

	@RequestMapping(value="/welcome")
	@ResponseBody
	public List<Project> welcome() {
		
		return projectService.projectList();
	}
}
