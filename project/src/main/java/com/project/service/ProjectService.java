/**
 * 
 */
package com.project.service;

import java.util.List;

import javax.annotation.Resource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.project.dao.ProjectDao;
import com.project.entity.Project;

/**
 * @author cleartor
 *
 * 2017Äê9ÔÂ13ÈÕ
 */
@Service
public class ProjectService {
	
	@Resource
	ProjectDao projectDao;
	
	public List<Project> projectList(){
		
		return projectDao.projectList();
	}

}
