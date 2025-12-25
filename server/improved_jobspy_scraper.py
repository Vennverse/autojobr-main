#!/usr/bin/env python3
"""
Improved JobSpy Scraper with Better Error Handling
Alternative scraper with fallback mechanisms and reliability improvements
"""

import os
import sys
import json
import time
import random
import psycopg2
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import traceback

# Import JobSpy with fallback
try:
    from jobspy import scrape_jobs
    JOBSPY_AVAILABLE = True
except ImportError:
    print("Warning: jobspy not available. Using fallback mode.")
    JOBSPY_AVAILABLE = False

class ImprovedJobSpyIntegration:
    def __init__(self):
        self.db_url = os.environ.get('DATABASE_URL')
        if not self.db_url:
            raise ValueError("DATABASE_URL environment variable not set")
        
        # Rate limiting settings
        self.min_delay = 2  # Minimum seconds between requests
        self.max_delay = 5  # Maximum seconds between requests
        self.rate_limit_delay = 10  # Delay when rate limited
        
    def get_db_connection(self):
        """Get database connection with retry logic"""
        max_retries = 3
        for attempt in range(max_retries):
            try:
                return psycopg2.connect(self.db_url)
            except Exception as e:
                if attempt == max_retries - 1:
                    raise e
                time.sleep(2)
    
    def smart_delay(self):
        """Implement smart delay to avoid rate limiting"""
        delay = random.uniform(self.min_delay, self.max_delay)
        time.sleep(delay)
    
    def scrape_with_retries(self, site_name, search_term, location, results_wanted, country=None):
        """Scrape with retry logic and error handling"""
        max_retries = 3
        base_delay = 5
        
        for attempt in range(max_retries):
            try:
                self.smart_delay()  # Rate limiting
                
                kwargs = {
                    'site_name': site_name,
                    'search_term': search_term,
                    'location': location,
                    'results_wanted': min(results_wanted, 15),  # Limit to avoid timeouts
                    'hours_old': 168,  # 1 week of jobs
                }
                
                # Add country parameter only for sites that support it
                if country and 'indeed' in site_name:
                    kwargs['country_indeed'] = country
                
                jobs_df = scrape_jobs(**kwargs)
                
                if jobs_df is not None and not jobs_df.empty:
                    return jobs_df
                else:
                    print(f"No jobs returned for {search_term} in {location}")
                    return pd.DataFrame()
                    
            except Exception as e:
                error_str = str(e).lower()
                print(f"Attempt {attempt + 1} failed for {search_term} in {location}: {e}")
                
                # Handle specific errors
                if "429" in error_str or "rate limit" in error_str:
                    wait_time = base_delay * (2 ** attempt) + self.rate_limit_delay
                    print(f"Rate limited, waiting {wait_time} seconds...")
                    time.sleep(wait_time)
                elif "403" in error_str or "blocked" in error_str:
                    print("Blocked by site, skipping this search")
                    break
                elif "timeout" in error_str or "connection" in error_str:
                    wait_time = base_delay * (2 ** attempt)
                    print(f"Connection issue, waiting {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    if attempt < max_retries - 1:
                        time.sleep(base_delay)
        
        return pd.DataFrame()
    
    def clean_job_data(self, df):
        """Clean and validate job data"""
        if df.empty:
            return df
        
        try:
            # Remove rows with missing essential data
            df = df.dropna(subset=['title', 'company'])
            
            # Clean and limit text fields
            text_columns = ['title', 'company', 'location', 'description']
            for col in text_columns:
                if col in df.columns:
                    df[col] = df[col].astype(str).str.strip()
                    if col == 'description':
                        df[col] = df[col].str[:3000]  # Limit description length
            
            # Handle salary columns
            for col in ['min_amount', 'max_amount']:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
            
            # Remove duplicates
            if len(df) > 1:
                df = df.drop_duplicates(subset=['title', 'company'], keep='first')
            
            return df
            
        except Exception as e:
            print(f"Error cleaning data: {e}")
            return df
    
    def save_jobs_to_db(self, jobs_df):
        """Save jobs to database with improved error handling"""
        if jobs_df.empty:
            return 0
        
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            saved_count = 0
            
            for _, job in jobs_df.iterrows():
                try:
                    # Prepare job data
                    # LOCATION FALLBACK: Ensure we always have a location
                    raw_location = str(job.get('location', 'Remote')).strip()
                    location = raw_location if raw_location and raw_location.lower() != 'none' else 'Remote'
                    
                    job_data = {
                        'title': str(job.get('title', 'Unknown Position')),
                        'company': str(job.get('company', 'Unknown Company')),
                        'location': location,
                        'description': str(job.get('description', 'No description available'))[:3000],
                        'date_posted': job.get('date_posted'),
                        'job_url': str(job.get('job_url', '')),
                        'site': str(job.get('site', 'jobspy')),
                        'job_type': str(job.get('job_type', 'Full-time')),
                        'salary_min': job.get('min_amount'),
                        'salary_max': job.get('max_amount'),
                        'is_remote': 'remote' in location.lower(),
                        'scraped_at': datetime.now(),
                    }
                    
                    # Check if job already exists
                    cursor.execute("""
                        SELECT id FROM job_postings 
                        WHERE title = %s AND company = %s AND location = %s
                    """, (job_data['title'], job_data['company'], job_data['location']))
                    
                    if cursor.fetchone() is None:
                        # Insert new job
                        insert_query = """
                            INSERT INTO job_postings 
                            (title, company, location, description, date_posted, job_url, 
                             site, job_type, salary_min, salary_max, is_remote, scraped_at, category, subcategory)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """
                        
                        cursor.execute(insert_query, (
                            job_data['title'], job_data['company'], job_data['location'],
                            job_data['description'], job_data['date_posted'], job_data['job_url'],
                            job_data['site'], job_data['job_type'], job_data['salary_min'],
                            job_data['salary_max'], job_data['is_remote'], job_data['scraped_at'],
                            'tech', 'software-engineering'  # Default category
                        ))
                        
                        saved_count += 1
                    
                except Exception as e:
                    print(f"Error saving individual job: {e}")
                    continue
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return saved_count
            
        except Exception as e:
            print(f"Database error: {e}")
            return 0
    
    def scrape_jobs_improved(self, config):
        """Main scraping function with improvements"""
        try:
            search_terms = config.get('search_terms', ['software engineer'])
            locations = config.get('locations', ['Remote'])
            job_sites = config.get('job_sites', ['indeed'])
            results_wanted = config.get('results_wanted', 20)
            country = config.get('country', 'USA')
            
            if not JOBSPY_AVAILABLE:
                return {
                    "success": False,
                    "error": "JobSpy library not available",
                    "scraped_count": 0,
                    "saved_count": 0,
                    "timestamp": datetime.now().isoformat()
                }
            
            # Use defaults if empty
            if not search_terms:
                search_terms = ['software engineer', 'developer']
            if not locations:
                locations = ['Remote', 'New York, NY']
            
            print(f"Starting improved scraping: {len(search_terms)} terms, {len(locations)} locations")
            
            all_jobs = []
            total_scraped = 0
            successful_searches = 0
            failed_searches = 0
            
            # Distribute results across searches
            results_per_search = max(1, results_wanted // (len(search_terms) * len(locations)))
            
            for search_term in search_terms:
                for location in locations:
                    print(f"Scraping: '{search_term}' in '{location}'")
                    
                    try:
                        jobs_df = self.scrape_with_retries(
                            site_name=job_sites,
                            search_term=search_term,
                            location=location,
                            results_wanted=results_per_search,
                            country=country
                        )
                        
                        if not jobs_df.empty:
                            jobs_df = self.clean_job_data(jobs_df)
                            if not jobs_df.empty:
                                all_jobs.append(jobs_df)
                                total_scraped += len(jobs_df)
                                successful_searches += 1
                                print(f"Successfully scraped {len(jobs_df)} jobs")
                            else:
                                failed_searches += 1
                        else:
                            failed_searches += 1
                            
                    except Exception as e:
                        print(f"Failed to scrape {search_term} in {location}: {e}")
                        failed_searches += 1
            
            # Process and save results
            saved_count = 0
            if all_jobs:
                try:
                    combined_df = pd.concat(all_jobs, ignore_index=True)
                    combined_df = self.clean_job_data(combined_df)
                    saved_count = self.save_jobs_to_db(combined_df)
                except Exception as e:
                    print(f"Error processing results: {e}")
            
            result = {
                "success": True,
                "scraped_count": total_scraped,
                "saved_count": saved_count,
                "successful_searches": successful_searches,
                "failed_searches": failed_searches,
                "search_terms": search_terms,
                "locations": locations,
                "job_sites": job_sites,
                "timestamp": datetime.now().isoformat()
            }
            
            return result
            
        except Exception as e:
            error_msg = f"Improved scraping failed: {str(e)}"
            print(f"Error: {error_msg}")
            traceback.print_exc()
            return {
                "success": False,
                "error": error_msg,
                "scraped_count": 0,
                "saved_count": 0,
                "timestamp": datetime.now().isoformat()
            }

def main():
    if len(sys.argv) != 2:
        print("Usage: python improved_jobspy_scraper.py '<config_json>'")
        sys.exit(1)
    
    try:
        config = json.loads(sys.argv[1])
        scraper = ImprovedJobSpyIntegration()
        result = scraper.scrape_jobs_improved(config)
        print(json.dumps(result))
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "scraped_count": 0,
            "saved_count": 0,
            "timestamp": datetime.now().isoformat()
        }
        print(json.dumps(error_result))

if __name__ == "__main__":
    main()